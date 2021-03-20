import mountSubmissionModeration from './SubmissionModeration/mount';
import mountOldReports from './OldReports/mount';

window.addEventListener('load', () => {
  /**
   * Render the submission helper tools for NP posts.
   */
  mountSubmissionModeration();

  /**
   * Render the old/dismissed comments for any comments and submissions that have already been approved or removed.
   * Old reddit doesn't show these like new reddit.
   */
  mountOldReports();
});
