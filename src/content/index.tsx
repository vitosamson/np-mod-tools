import { render } from 'preact';
import SubmissionModeration from './SubmissionModeration';
import * as utils from './utils';

const bodyClass = document.body.classList;
const submissionEl = document.querySelector('.linklisting .link.self');
const shouldRender = bodyClass.contains('moderator') && bodyClass.contains('comments-page') && submissionEl;

if (shouldRender) {
  const moderationWrapper = document.createElement('div');
  submissionEl.querySelector('.entry').appendChild(moderationWrapper);

  render(<SubmissionModeration />, moderationWrapper);

  console.log('subreddit', utils.getSubreddit());
  console.log('submission id', utils.getSubmissionId());
  console.log('modmail message id', utils.getModmailMessageId());
}
