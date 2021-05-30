import * as marked from 'marked';
import { useCallback, useState } from 'preact/hooks';
import { renderStickyComment, CommentResponse } from './SubmissionModeration/StickyComment';

marked.setOptions({
  gfm: true,
  sanitize: true,
});

let token = '';
let subreddit = '';
let submissionId = '';

const formContentType = 'application/x-www-form-urlencoded';

// override global fetch so we can catch non-200 responses as errors
// https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
export function fetch(input: RequestInfo, init?: RequestInit) {
  return window.fetch(input, init).then(res => {
    if (!res.ok) {
      console.error(res.json());
      throw res;
    }
    return res;
  });
}

/**
 * Make an oauth authorized reddit api call
 */
export async function makeOauthCall<TResponse>(
  url: string,
  method = 'GET',
  payload?: any,
  headers?: object
): Promise<TResponse> {
  await getAccessToken();

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    credentials: 'same-origin',
    body: payload,
  });
  return res.json();
}

/**
 * Sends a message to the background script to fetch the oauth token and returns it.
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
 * Parses the submission ID from the current URL and returns it.
 */
export function getSubmissionId() {
  if (submissionId) return submissionId;
  submissionId = window.location.href.match(/comments\/(\w+)\//)![1];
  submissionId = `t3_${submissionId}`;
  return submissionId;
}

/**
 * Parses the subreddit name from the current URL and returns it.
 */
export function getSubreddit() {
  if (subreddit) return subreddit;
  subreddit = window.location.href.match(/\/r\/(\w+)\//)![1];
  return subreddit;
}

/**
 * Updates the displayed flair text on the page (does not hit the API, this is only for local feedback)
 */
export function updateDisplayedFlair(flairText: string) {
  let flairEl: HTMLElement | null = document.querySelector('.linkflairlabel');

  if (flairEl && !flairText) {
    flairEl.remove();
    return;
  } else if (!flairText) {
    return;
  }

  if (!flairEl) {
    flairEl = document.createElement('span');
    flairEl.className = 'linkflairlabel';
    document.querySelector('.entry .title a')?.insertAdjacentElement('afterend', flairEl);
  }

  flairEl.innerText = flairText;
}

/**
 * Updates the post's flair
 */
export async function flairPost(flairText: string) {
  const form = new URLSearchParams();
  const sub = getSubreddit();
  form.set('link', getSubmissionId());
  form.set('text', flairText);

  const res = await makeOauthCall<{ success: boolean }>(`https://oauth.reddit.com/r/${sub}/api/flair`, 'POST', form, {
    'content-type': formContentType,
  });

  if (!res.success) {
    throw new Error(`Unable to flair post: ${res}`);
  }

  updateDisplayedFlair(flairText);
}

/**
 * Determines if the post has already been rejected by checking if it has the Rejected flair
 * @todo this no longer works since the post is now just flaired with the rule letters, not "Rejected"
 */
export function postAlreadyRejected() {
  const flair = document.querySelector('.linkflairlabel') as HTMLElement;
  return flair && /Rejected/.test(flair.innerText);
}

/**
 * Determines if the post has already been approved by checking if the Approve button isn't present
 */
export function postAlreadyApproved() {
  const approveButton = document.querySelector('.link [data-event-action="approve"]');
  return !approveButton;
}

/**
 * Determines it the post has already been marked as RFE by checking if it has the RFE flair
 */
export function postAlreadyRFEd() {
  const flair = document.querySelector('.linkflairlabel') as HTMLElement;
  return flair && /RFE/.test(flair.innerText);
}

/**
 * Approves the post
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
  title?.parentNode?.insertBefore(checkmark, title.nextSibling);

  const bodyWrapper = document.querySelector('.thing.link.spam');
  bodyWrapper?.classList.remove('spam');

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
 */
export async function getRules(kind: RuleKind = 'link') {
  const sub = getSubreddit();
  const res = await fetch(`https://www.reddit.com/r/${sub}/about/rules.json`, {
    mode: 'no-cors',
  });
  const json: { rules: SubredditRule[] } = await res.json();

  return json.rules.filter(rule => rule.kind === kind);
}

/**
 * Posts a new comment in the thread and returns the comment ID.
 */
export async function postComment(content: string) {
  const form = new URLSearchParams();
  form.set('text', content);
  form.set('parent', getSubmissionId());
  form.set('api_type', 'json');

  const res = await makeOauthCall<{ json: { data: { things: Array<{ data: CommentResponse }> } } }>(
    'https://oauth.reddit.com/api/comment',
    'POST',
    form,
    {
      'content-type': formContentType,
    }
  );
  return res.json.data.things[0].data.name;
}

/**
 * Distinguishes and stickies a comment
 */
export function stickyComment(
  commentId: string
): Promise<{ json: { data: { things: Array<{ data: CommentResponse }> } } }> {
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
 */
export async function postStickyComment(body: string) {
  const commentId = await postComment(body);
  const commentResponse = await stickyComment(commentId);
  renderStickyComment(commentResponse.json.data.things[0].data);
}

/**
 * Gets the submission sticky from the sub's wiki, then posts it as a distinguished sticky comment on the thread
 */
export async function postSubmissionSticky() {
  const sub = getSubreddit();
  const res = await makeOauthCall<{ data: { content_md: string } }>(
    `https://oauth.reddit.com/r/${sub}/wiki/submission_sticky.json`
  );
  const sticky = res.data.content_md;
  return postStickyComment(sticky);
}

/**
 * Converts reddit's markdown to html
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

export function useToggleState(defaultState: boolean): [boolean, () => void] {
  const [state, setState] = useState(defaultState);
  const toggleState = useCallback(() => setState(!state), [state]);
  return [state, toggleState];
}

export function getCurrentUser() {
  return document.querySelector('.user > a[href*="/user/"]')?.textContent;
}
