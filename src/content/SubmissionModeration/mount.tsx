import { render } from 'preact';
import SubmissionModeration from './SubmissionModeration';
import { isMod, getSubreddit, getSubmissionId, getModmailMessageId, isCommentsPage } from '../utils';

export default function mountSubmissionModeration() {
  const submissionEl = document.querySelector('.linklisting .link.self');

  if (!isMod() || !isCommentsPage() || !submissionEl) {
    return;
  }

  const moderationWrapper = document.createElement('div');
  submissionEl.querySelector('.entry').appendChild(moderationWrapper);

  render(<SubmissionModeration />, moderationWrapper);

  console.log('subreddit', getSubreddit());
  console.log('submission id', getSubmissionId());
  console.log('modmail message id', getModmailMessageId());
}
