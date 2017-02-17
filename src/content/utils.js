import showdown from 'showdown';
import { createStickyCommentMarkup } from './SubmissionModeration/StickyComment';

const markdownConverter = new showdown.Converter({
  simplifiedAutoLink: true,
});

const npModUtils = {
  token: '',
  subreddit: '',
  submissionId: '',
  modmailMessageId: '',
};

export default npModUtils;

// override global fetch so we can catch non-200 responses as errors
// https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
npModUtils.fetch = (...args) => {
  return window.fetch(...args).then(res => {
    if (!res.ok) {
      console.error(res);
      throw res;
    }
    return res;
  });
};

/**
 * Sends a message to the background script to fetch the oauth token
 */
npModUtils.getAccessToken = () => {
  if (npModUtils.token) return Promise.resolve(npModUtils.token);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'oauth' }, token => {
      console.log('token:', token);
      npModUtils.token = token;
      resolve(token);
    });
  });
};

/**
 * Parses the submission ID from the current URL
 * @return {string} the submission ID
 */
npModUtils.getSubmissionId = () => {
  if (npModUtils.submissionId) return npModUtils.submissionId;
  let submissionId = window.location.href.match(/comments\/(\w+)\//)[1];
  submissionId = `t3_${submissionId}`;
  npModUtils.submissionId = submissionId;
  return submissionId;
};

/**
 * Parses the subreddit name from the current URL
 * @return {string} the subreddit name
 */
npModUtils.getSubreddit = () => {
  if (npModUtils.subreddit) return npModUtils.subreddit;
  const subreddit = window.location.href.match(/\/r\/(\w+)\//)[1];
  npModUtils.subreddit = subreddit;
  return subreddit;
};

/**
 * Tries to find the TrackbackLinkBot comment in the current thread
 * @return {string} the link to the modmail thread
 */
npModUtils.getModmailMessageLink = () => {
  if (npModUtils.modmailMessageLink) return npModUtils.modmailMessageLink;
  const oldModmailPattern = 'a[href^="https://www.reddit.com/message/messages"]';
  const newModmailPattern = 'a[href^="https://mod.reddit.com"]';
  const trackbackComment = [...document.querySelectorAll('.nestedlisting .comment')].find(c =>
    !!c.querySelector(oldModmailPattern) || !!c.querySelector(newModmailPattern)
  );
  let trackbackLink;

  if (!trackbackComment) return '';

  /* eslint-disable no-cond-assign*/
  if ((trackbackLink = trackbackComment.querySelector(oldModmailPattern))) {
    npModUtils.useNewModmail = false;
  } else if ((trackbackLink = trackbackComment.querySelector(newModmailPattern))) {
    npModUtils.useNewModmail = true;
  } else {
    return null;
  }
  /* eslint-enable no-cond-assign */

  return trackbackLink.innerText;
};

/**
 * Parses the modmail message id from the TrackbackLinkBot comment
 * @return {string} the modmail message ID
 */
npModUtils.getModmailMessageId = () => {
  if (npModUtils.modmailMessageId) return npModUtils.modmailMessageId;
  const trackbackLink = npModUtils.getModmailMessageLink();
  const modmailMessageId = trackbackLink.slice(trackbackLink.lastIndexOf('/') + 1);
  return modmailMessageId;
};

npModUtils.getModmailReplies = () => {
  const messageId = npModUtils.getModmailMessageId();

  if (npModUtils.useNewModmail) {
    return npModUtils.fetch(`https://oauth.reddit.com/api/mod/conversations/${messageId}`, {
      headers: {
        Authorization: `Bearer ${npModUtils.token}`,
      },
    }).then(res => res.json()).then(res => {
      const replies = Object.keys(res.messages).map(id => res.messages[id]).sort((a, b) => {
        return a.date.localeCompare(b.date);
      }).filter(reply => reply.author.name !== 'AutoModerator').map(reply => ({
        from: reply.author.name,
        body: npModUtils.markdownToHtml(reply.bodyMarkdown),
        created: reply.date,
        id: reply.id,
      }));
      return replies;
    });
  } else {
    return npModUtils.fetch(`https://oauth.reddit.com/message/messages/${messageId}`, {
      headers: {
        Authorization: `Bearer ${npModUtils.token}`,
      },
    }).then(res => res.json()).then(res => {
      const automodMessage = res.data.children[0].data;
      const replies = automodMessage.replies.data.children.sort((a, b) =>
        a.data.created - b.data.created
      ).map(child => ({
        from: child.data.author,
        body: npModUtils.markdownToHtml(child.data.body),
        created: child.data.created_utc * 1000,
        id: child.data.id,
      }));
      return replies;
    });
  }
};

/**
 * Updates the displayed flair text on the page (does not hit the API, this is only for local feedback)
 * @param  {string} flairText
 */
npModUtils.updateFlairText = flairText => {
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
  flairEl.innerText = flairText;
};

/**
 * Updates the post's flair
 * @param  {string} flairText
 * @return {Promise}
 */
npModUtils.flairPost = (flairText) => {
  const submissionId = npModUtils.getSubmissionId();
  const form = new URLSearchParams();
  form.set('link', submissionId);
  form.set('text', flairText);

  return npModUtils.fetch('https://oauth.reddit.com/r/vs845/api/flair', {
    method: 'POST',
    body: form,
    headers: {
      Authorization: `Bearer ${npModUtils.token}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
  }).then(res => res.json()).then(res => {
    if (!res.success) {
      throw new Error();
    }

    npModUtils.updateFlairText(flairText);
  });
};

/**
 * Determines if the post has already been rejected by checking if it has the Rejected flair
 * @return {boolean}
 */
npModUtils.postAlreadyRejected = () => {
  const flair = document.querySelector('.linkflairlabel');
  return flair && flair.innerText.match(/Rejected/);
};

/**
 * Determines if the post has already been approved by checking if the Approve button isn't present
 * @return {boolean}
 */
npModUtils.postAlreadyApproved = () => {
  const approveButton = document.querySelector('.link [data-event-action="approve"]');
  return !approveButton;
};

/**
 * Determines it the post has already been marked as RFE
 * @return {boolean}
 */
npModUtils.postAlreadyRFEd = () => {
  const flair = document.querySelector('.linkflairlabel');
  return flair && flair.innerText.match(/RFE/);
};

/**
 * Sends a modmail message
 * @param  {string}  message           the message to send
 * @return {Promise}
 */
npModUtils.updateModmail = (message) => {
  const messageId = npModUtils.getModmailMessageId();
  const form = new URLSearchParams();

  if (npModUtils.useNewModmail) {
    form.set('body', message);

    return npModUtils.fetch(`https://oauth.reddit.com/api/mod/conversations/${messageId}`, {
      method: 'POST',
      body: form,
      headers: {
        Authorization: `Bearer ${npModUtils.token}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
  } else {
    form.set('text', message);
    form.set('parent', `t4_${messageId}`);

    // old modmail uses the same api as comments
    return npModUtils.fetch('https://oauth.reddit.com/api/comment', {
      method: 'POST',
      body: form,
      headers: {
        Authorization: `Bearer ${npModUtils.token}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
  }
};

/**
 * Approves the post
 * @return {Promise}
 */
npModUtils.approvePost = () => {
  const submissionId = npModUtils.getSubmissionId();
  const form = new URLSearchParams();
  form.set('id', submissionId);

  return npModUtils.fetch('https://oauth.reddit.com/api/approve', {
    method: 'POST',
    body: form,
    headers: {
      Authorization: `Bearer ${npModUtils.token}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
  }).then(() => npModUtils.markPostApproved());
};

/**
 * Updates various UI elements to show that the post was approved:
 * removes the default approve button,
 * adds the green checkmark,
 * removes the `spam` class from the post body so it's not red
 */
npModUtils.markPostApproved = () => {
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
};

/**
 * Fetches the subreddit's rules, to be used for rejection reasons
 * @param  {string} [kind='link'] the type of rules to return. we're typically only interested in links here
 * @return {Promise}              promise that resolves with an array of rules
 */
npModUtils.getRules = (kind = 'link') => {
  const subreddit = npModUtils.getSubreddit();

  return npModUtils.fetch(`/r/${subreddit}/about/rules.json`).then(res => res.json()).then(res => {
    const rules = res.rules.filter(rule => rule.kind === kind);
    return rules;
  });
};

/**
 * Posts a new comment in the thread
 * @param  {string} content
 * @return {Promise} promise that resolves with the comment ID
 */
npModUtils.postComment = (content) => {
  const form = new URLSearchParams();
  form.set('text', content);
  form.set('parent', npModUtils.getSubmissionId());
  form.set('api_type', 'json');

  return npModUtils.fetch('https://oauth.reddit.com/api/comment', {
    method: 'POST',
    body: form,
    headers: {
      Authorization: `Bearer ${npModUtils.token}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
  }).then(res => res.json()).then(res => {
    return res.json.data.things[0].data.name;
  });
};

/**
 * Distinguishes and stickies a comment
 * @param  {string} commentId
 * @return {Promise}
 */
npModUtils.stickyComment = commentId => {
  const form = new URLSearchParams();
  form.set('id', commentId);
  form.set('how', 'yes');
  form.set('sticky', true);
  form.set('api_type', 'json');

  return npModUtils.fetch('https://oauth.reddit.com/api/distinguish', {
    method: 'POST',
    body: form,
    headers: {
      Authorization: `Bearer ${npModUtils.token}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
  });
};

/**
 * Posts a distinguished sticky comment
 * @param  {string} body
 * @return {Promise}
 */
npModUtils.postStickyComment = body => {
  return npModUtils.postComment(body).then(commentId => {
    return npModUtils.stickyComment(commentId);
  }).then(res => res.json()).then(res => {
    const commentResponse = res.json.data.things[0].data;
    const commentMarkup = createStickyCommentMarkup(commentResponse);
    document.querySelector('.sitetable.nestedlisting').prepend(commentMarkup);
  }).catch(err => {
    console.log(err);
    throw err;
  });
};

/**
 * Gets the submission sticky from the sub's wiki, then posts it as a distinguished sticky comment on the thread
 * @return {Promise}
 */
npModUtils.postSubmissionSticky = () => {
  const subreddit = npModUtils.getSubreddit();

  return npModUtils.fetch(`https://oauth.reddit.com/r/${subreddit}/wiki/submission_sticky.json`, {
    headers: {
      Authorization: `Bearer ${npModUtils.token}`,
    },
  }).then(res => res.json()).then(res => {
    const sticky = res.data.content_md;
    return npModUtils.postStickyComment(sticky);
  });
};

/**
 * Converts reddit's markdown to html
 * @param  {string} markdown the markdown returned from reddit
 * @return {string}          the html markup
 */
npModUtils.markdownToHtml = markdown => {
  try {
    const html = markdownConverter.makeHtml(markdown);

    // for new modmail, reddit returns the markdown wrapped in a div.md, which adds margins we don't want
    const div = document.createElement('div');
    div.innerHTML = html;
    if (div && div.childNodes[0] && div.childNodes[0].classList.contains('md')) {
      return div.childNodes[0].innerHTML;
    } else {
      return html;
    }
  } catch (e) {
    console.log(e);
    return '';
  }
};
