import { render } from 'preact';
import OldReports from './OldReports';
import { isMod, isCommentsPage, isSubmissionsPage } from '../utils';

export default function mountOldReports() {
  if (!isMod()) {
    return;
  }

  if (isCommentsPage()) {
    mountComments();
  }

  if (isSubmissionsPage()) {
    mountSubmissions();
  }
}

function mountComments() {
  const comments = Array.from(document.querySelectorAll('.thing.comment'));
  const approvedComments = comments.filter(
    comment =>
      !!comment.querySelector('.thing>.entry>.tagline>.approval-checkmark') ||
      !!comment.classList.contains('spam')
  );
  approvedComments.forEach(async (el: HTMLElement) => {
    const permalink = el.dataset['permalink'];
    const thingId = el.dataset['fullname'];

    if (!permalink) {
      return;
    }

    try {
      const res = await fetch(`https://reddit.com/${permalink}.json`);
      const json = await res.json();
      const commentData = json[1].data.children[0].data;
      const userReports: [string, number][] =
        commentData.user_reports_dismissed || [];
      const modReports: [string, string][] =
        commentData.mod_reports_dismissed || [];

      if (!userReports.length && !modReports.length) {
        return;
      }

      const container = createContainerElement(el);
      render(
        <OldReports userReports={userReports} modReports={modReports} />,
        container
      );
    } catch (err) {
      console.error("couldn't get comment data for comment", thingId);
      console.error(err);
    }
  });
}

function mountSubmissions() {
  const submissions = Array.from(document.querySelectorAll('.thing.link'));
  const approvedSubmissions = submissions.filter(
    submission =>
      !!submission.querySelector(
        '.thing>.entry>.top-matter>.title>.approval-checkmark'
      ) &&
      !submission.querySelector(
        '.thing>.entry>.top-matter>.title>.approval-checkmark[title*=NeutralverseBot]'
      )
  );
  approvedSubmissions.forEach(async (el: HTMLElement) => {
    const permalink = el.dataset['permalink'];
    const thingId = el.dataset['fullname'];

    if (!permalink) {
      return;
    }

    try {
      const res = await fetch(`https://reddit.com/${permalink}.json`);
      const json = await res.json();
      const submissionData = json[0].data.children[0].data;
      const userReports: [string, number][] =
        submissionData.user_reports_dismissed || [];
      const modReports: [string, string][] =
        submissionData.mod_reports_dismissed || [];

      if (!userReports.length && !modReports.length) {
        return;
      }

      const container = createContainerElement(el);
      render(
        <OldReports userReports={userReports} modReports={modReports} />,
        container
      );
    } catch (err) {
      console.error("couldn't get submission data for submission", thingId);
      console.error(err);
    }
  });
}

function createContainerElement(parentElement: HTMLElement) {
  const entry = parentElement.querySelector('.entry');
  const div = document.createElement('div');
  div.style.backgroundColor = '#f6e69f';
  div.style.padding = '6px 8px';
  div.style.fontSize = '1.1em';
  div.style.maxWidth = '74em';
  entry.appendChild(div);
  return div;
}
