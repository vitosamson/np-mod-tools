import { render } from 'preact';
import SubmissionModeration from './SubmissionModeration';
import { isMod, getSubreddit, getSubmissionId, isCommentsPage } from '../utils';
import { getSlackToken } from '../slack';

export default async function mountSubmissionModeration() {
  const submissionEl = document.querySelector('.linklisting .link.self');

  if (!isMod() || !isCommentsPage() || !submissionEl) {
    return;
  }

  await getSlackToken();

  const moderationWrapper = document.createElement('div');
  submissionEl.querySelector('.entry')?.appendChild(moderationWrapper);

  render(<SubmissionModeration />, moderationWrapper);

  console.log('subreddit', getSubreddit());
  console.log('submission id', getSubmissionId());
}
