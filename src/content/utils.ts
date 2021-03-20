import * as marked from 'marked';
import { renderStickyComment } from './SubmissionModeration/StickyComment';

marked.setOptions({
  gfm: true,
  sanitize: true,
});

let token = '';
let subreddit = '';
let submissionId = '';
let modmailMessageId = '';
let modmailMessageLink = '';
let useNewModmail = false;

const formContentType = 'application/x-www-form-urlencoded';

// override global fetch so we can catch non-200 responses as errors
// https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
export function fetch(input: RequestInfo, init?: RequestInit) {
  return window.fetch(input, init).then(res => {
    if (!res.ok) {
      console.error(res);
      throw res;
    }
    return res;
  });
}

/**
 * Make an oauth authorized reddit api call
 */
export function makeOauthCall(url: string, method = 'GET', payload?: any, headers?: object) {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    credentials: 'same-origin',
    body: payload,
  });
}

/**
 * Sends a message to the background script to fetch the oauth token
 * @return {Promise<string>} the oauth token
 */
export function getAccessToken() {
  if (token) return Promise.resolve(token);

  return new Promise<string>(resolve => {
    chrome.runtime.sendMessage({ action: 'oauth' }, (t: string) => {
      console.log('token:', t);
      token = t;
      resolve(t);
    });
  });
}

/**
 * Parses the submission ID from the current URL
 * @return {string} the submission ID
 */
export function getSubmissionId() {
  if (submissionId) return submissionId;
  submissionId = window.location.href.match(/comments\/(\w+)\//)[1];
  submissionId = `t3_${submissionId}`;
  return submissionId;
}

/**
 * Parses the subreddit name from the current URL
 * @return {string} the subreddit name
 */
export function getSubreddit() {
  if (subreddit) return subreddit;
  subreddit = window.location.href.match(/\/r\/(\w+)\//)[1];
  return subreddit;
}

/**
 * Tries to find the TrackbackLinkBot comment in the current thread
 * @return {string} the link to the modmail thread
 */
export function getModmailMessageLink() {
  if (modmailMessageLink) return modmailMessageLink;
  const oldModmailPattern = 'a[href^="https://www.reddit.com/message/messages"]';
  const newModmailPattern = 'a[href^="https://mod.reddit.com"]';
  const trackbackComment = Array.from(document.querySelectorAll('.nestedlisting .comment')).find(
    c => !!c.querySelector(oldModmailPattern) || !!c.querySelector(newModmailPattern)
  );
  let trackbackLink: HTMLElement;

  if (!trackbackComment) return '';

  /* tslint:disable:no-conditional-assignment */
  if ((trackbackLink = trackbackComment.querySelector(oldModmailPattern))) {
    useNewModmail = false;
  } else if ((trackbackLink = trackbackComment.querySelector(newModmailPattern))) {
    useNewModmail = true;
  } else {
    return null;
  }
  /* tslint:enable:no-conditional-assignment */

  modmailMessageLink = trackbackLink.innerText;
  return modmailMessageLink;
}

/**
 * Parses the modmail message id from the TrackbackLinkBot comment
 * @return {string} the modmail message ID
 */
export function getModmailMessageId() {
  if (modmailMessageId) return modmailMessageId;
  const trackbackLink = getModmailMessageLink();
  modmailMessageId = trackbackLink.slice(trackbackLink.lastIndexOf('/') + 1);
  return modmailMessageId;
}

interface NewModMailMessage {
  date: string;
  author: {
    name: string;
  };
  bodyMarkdown: string;
  id: string;
}

interface NewModmailResponse {
  messages: {
    [id: string]: NewModMailMessage;
  };
}

interface OldModmailMessage {
  data: {
    author: string;
    body: string;
    created: number;
    created_utc: number;
    id: string;
    replies:
      | string
      | {
          // this may be an empty string if there are no replies - seems to be a reddit bug
          data: {
            children: OldModmailMessage[];
          };
        };
  };
}

interface OldModmailResponse {
  data: {
    children: OldModmailMessage[];
  };
}

export interface NormalizedModmailMessage {
  from: string;
  body: string;
  created: Date;
  id: string;
}

/**
 * Gets the modmail messages for the submission
 */
export function getModmailReplies(): Promise<NormalizedModmailMessage[]> {
  const messageId = getModmailMessageId();

  if (useNewModmail) {
    return makeOauthCall(`https://oauth.reddit.com/api/mod/conversations/${messageId}`)
      .then(res => res.json())
      .then((res: NewModmailResponse) => {
        const replies = Object.keys(res.messages)
          .map(id => res.messages[id])
          .sort((a, b) => {
            return a.date.localeCompare(b.date);
          })
          .filter(reply => reply.author.name !== 'AutoModerator')
          .map(reply => ({
            from: reply.author.name,
            body: markdownToHtml(reply.bodyMarkdown),
            created: new Date(reply.date),
            id: reply.id,
          }));
        return replies;
      });
  } else {
    return makeOauthCall(`https://oauth.reddit.com/message/messages/${messageId}`)
      .then(res => res.json())
      .then((res: OldModmailResponse) => {
        const automodMessage = res.data.children[0].data;
        if (typeof automodMessage.replies === 'string') {
          return [];
        } else {
          const replies = automodMessage.replies.data.children
            .sort((a, b) => a.data.created - b.data.created)
            .map(child => ({
              from: child.data.author,
              body: markdownToHtml(child.data.body),
              created: new Date(child.data.created_utc * 1000),
              id: child.data.id,
            }));
          return replies;
        }
      });
  }
}

/**
 * Updates the displayed flair text on the page (does not hit the API, this is only for local feedback)
 * @param  {string} flairText
 */
export function updateDisplayedFlair(flairText: string) {
  let flairEl = document.querySelector('.linkflairlabel');

  if (flairEl && !flairText) {
    flairEl.remove();
    return;
  } else if (!flairText) {
    return;
  }

  if (!flairEl) {
    flairEl = document.createElement('span');
    flairEl.className = 'linkflairlabel';
    document.querySelector('.entry .title a').insertAdjacentElement('afterend', flairEl);
  }

  (flairEl as HTMLElement).innerText = flairText;
}

/**
 * Updates the post's flair
 * @param  {string} flairText
 * @return {Promise}
 */
export function flairPost(flairText: string) {
  const form = new URLSearchParams();
  const sub = getSubreddit();
  form.set('link', getSubmissionId());
  form.set('text', flairText);

  return makeOauthCall(`https://oauth.reddit.com/r/${sub}/api/flair`, 'POST', form, {
    'content-type': formContentType,
  })
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        throw new Error();
      }

      updateDisplayedFlair(flairText);
    });
}

/**
 * Determines if the post has already been rejected by checking if it has the Rejected flair
 * @todo this no longer works since the post is now just flaired with the rule letters, not "Rejected"
 * @return {boolean}
 */
export function postAlreadyRejected() {
  const flair = document.querySelector('.linkflairlabel') as HTMLElement;
  return flair && /Rejected/.test(flair.innerText);
}

/**
 * Determines if the post has already been approved by checking if the Approve button isn't present
 * @return {boolean}
 */
export function postAlreadyApproved() {
  const approveButton = document.querySelector('.link [data-event-action="approve"]');
  return !approveButton;
}

/**
 * Determines it the post has already been marked as RFE by checking if it has the RFE flair
 * @return {boolean}
 */
export function postAlreadyRFEd() {
  const flair = document.querySelector('.linkflairlabel') as HTMLElement;
  return flair && /RFE/.test(flair.innerText);
}

/**
 * Sends a modmail message
 * @param  {string}  message the message to send
 * @return {Promise}
 */
export function updateModmail(message: string) {
  const messageId = getModmailMessageId();
  const form = new URLSearchParams();
  let url: string;

  if (useNewModmail) {
    form.set('body', message);
    url = `https://oauth.reddit.com/api/mod/conversations/${messageId}`;
  } else {
    form.set('text', message);
    form.set('parent', `t4_${messageId}`);

    // old modmail uses the same api as comments
    url = 'https://oauth.reddit.com/api/comment';
  }

  return makeOauthCall(url, 'POST', form, {
    'content-type': formContentType,
  });
}

/**
 * Approves the post
 * @return {Promise}
 */
export function approvePost() {
  const form = new URLSearchParams();
  form.set('id', getSubmissionId());

  return makeOauthCall('https://oauth.reddit.com/api/approve', 'POST', form, {
    'content-type': formContentType,
  }).then(markPostApproved);
}

/**
 * Removes the post from the modqueue
 */
export function removePost() {
  const form = new URLSearchParams();
  form.set('id', getSubmissionId());
  form.set('spam', 'false');

  return makeOauthCall('https://oauth.reddit.com/api/remove', 'POST', form, {
    'content-type': formContentType,
  });
}

/**
 * Updates various UI elements to show that the post was approved:
 *  - removes the default approve button,
 *  - adds the green checkmark,
 *  - removes the `spam` class from the post body so it's not red
 */
export function markPostApproved() {
  const approveButton = document.querySelector('.link [data-event-action="approve"]');
  if (approveButton) {
    approveButton.remove();
  }

  const title = document.querySelector('.link a.title');
  const checkmark = document.createElement('img');
  checkmark.className = 'approval-checkmark';
  checkmark.setAttribute('src', '//www.redditstatic.com/green-check.png');
  title.parentNode.insertBefore(checkmark, title.nextSibling);

  const bodyWrapper = document.querySelector('.thing.link.spam');
  bodyWrapper.classList.remove('spam');

  const removedNotice = document.querySelector('.thing.link li[title^="removed at"]');
  if (removedNotice) {
    removedNotice.remove();
  }
}

type RuleKind = 'link' | 'comment';
export interface SubredditRule {
  short_name: string;
  kind: RuleKind;
}

/**
 * Fetches the subreddit's rules, to be used for rejection reasons
 * @param  {string} [kind='link'] the type of rules to return. we're typically only interested in links here
 * @return {Promise<SubredditRule[]>}
 */
export function getRules(kind: RuleKind = 'link') {
  const sub = getSubreddit();

  return fetch(`https://reddit.com/r/${sub}/about/rules.json`, {
    mode: 'no-cors',
  })
    .then(res => res.json())
    .then((res: { rules: SubredditRule[] }) => {
      const rules = res.rules.filter(rule => rule.kind === kind);
      return rules;
    });
}

/**
 * Posts a new comment in the thread
 * @param  {string} content
 * @return {Promise<string>} promise that resolves with the comment ID
 */
export function postComment(content: string) {
  // TODO: URLSearchParams is not supported in Opera, so replace or polyfill it
  const form = new URLSearchParams();
  form.set('text', content);
  form.set('parent', getSubmissionId());
  form.set('api_type', 'json');

  return makeOauthCall('https://oauth.reddit.com/api/comment', 'POST', form, {
    'content-type': formContentType,
  })
    .then(res => res.json())
    .then(res => {
      return res.json.data.things[0].data.name;
    });
}

/**
 * Distinguishes and stickies a comment
 * @param  {string} commentId
 * @return {Promise}
 */
export function stickyComment(commentId: string) {
  const form = new URLSearchParams();
  form.set('id', commentId);
  form.set('how', 'yes');
  form.set('sticky', 'true');
  form.set('api_type', 'json');

  return makeOauthCall('https://oauth.reddit.com/api/distinguish', 'POST', form, {
    'content-type': formContentType,
  });
}

/**
 * Posts, distinguishes and stickies a comment
 * @param  {string} body
 * @return {Promise}
 */
export function postStickyComment(body: string) {
  return postComment(body)
    .then(commentId => {
      return stickyComment(commentId);
    })
    .then(res => res.json())
    .then(res => {
      const commentResponse = res.json.data.things[0].data;
      renderStickyComment(commentResponse);
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
}

/**
 * Gets the submission sticky from the sub's wiki, then posts it as a distinguished sticky comment on the thread
 * @return {Promise}
 */
export function postSubmissionSticky() {
  const sub = getSubreddit();

  return makeOauthCall(`https://oauth.reddit.com/r/${sub}/wiki/submission_sticky.json`)
    .then(res => res.json())
    .then(res => {
      const sticky = res.data.content_md;
      return postStickyComment(sticky);
    });
}

/**
 * Converts reddit's markdown to html
 * @param  {string} markdown the markdown returned from reddit
 * @return {string}          the html markup
 */
export function markdownToHtml(markdown: string) {
  markdown = (markdown || '').replace(/&gt;/g, '>');

  try {
    const html = marked(markdown);

    // for new modmail, reddit returns the markdown wrapped in a div.md, which adds margins we don't want
    const div = document.createElement('div');
    div.innerHTML = html;
    const child = div && (div.childNodes[0] as HTMLElement);

    if (child && child.classList.contains('md')) {
      return child.innerHTML;
    } else {
      return html;
    }
  } catch (e) {
    console.log(e);
    return '';
  }
}

export function isMod() {
  return document.body.classList.contains('moderator');
}

export function isCommentsPage() {
  return document.body.classList.contains('comments-page');
}

export function isSubmissionsPage() {
  return document.body.classList.contains('listing-page');
}
