import React from 'react';
import { render } from 'react-dom';
import SubmissionModeration from './SubmissionModeration';
import npModUtils from './utils';

const bodyClass = document.body.classList;
const shouldRender = bodyClass.contains('moderator') && bodyClass.contains('comments-page');
// const shouldRender = npModUtils.getSubreddit().toLowerCase() === 'neutralpolitics';

if (shouldRender) {
  const submissionEl = document.querySelector('.linklisting .link.self');
  const moderationWrapper = document.createElement('div');
  submissionEl.querySelector('.entry').appendChild(moderationWrapper);

  render(<SubmissionModeration />, moderationWrapper);

  console.log('subreddit', npModUtils.getSubreddit());
  console.log('submission id', npModUtils.getSubmissionId());
  console.log('modmail message id', npModUtils.getModmailMessageId());
  console.log('use new modmail', npModUtils.useNewModmail);
}
