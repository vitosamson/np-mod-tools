/* eslint camelcase: [0] */

import React, { PropTypes } from 'react';
import { render } from 'react-dom';

export default function StickyComment(props) {
  const { name, author, body_html, subreddit, subreddit_id } = props.commentResponse;
  const outerClassName = `thing id-${name} stickied noncollapsed comment new-comment ut-thing`;

  return (
    <div
      className={outerClassName}
      id={`thing_${name}`}
      data-fullname={name}
      data-type="comment"
      data-subreddit={subreddit}
      data-subreddit-fullname={subreddit_id}
      data-author={author}
    >
      <div className="midcol likes">
        <div className="arrow upmod" />
        <div className="arrow down" />
      </div>

      <div className="entry likes">
        <p className="tagline">
          <a href="#" className="expand">[–]</a>
          <a href={`/user/${author}`} className="author moderator">{ author }</a>
          <span className="userattrs">
            [<a href="#" className="moderator">M</a>]
          </span>
          <span className="score likes">1 point</span>
          <time className="live-timestamp"> just now</time>
          <span className="stickied-tagline">stickied comment</span>
        </p>

        <form action="#" className="usertext">
          <div
            className="usertext-body md-container"
            dangerouslySetInnerHTML={{
              __html: body_html,
            }}
          />
        </form>
      </div>
    </div>
  );
}

StickyComment.propTypes = {
  commentResponse: PropTypes.object,
};

export function createStickyCommentMarkup(commentResponse) {
  const div = document.createElement('div');

  // some hackery to convert the sanitized html (&gt; etc) returned from the reddit api
  // into regular tags for use in dangerouslySetInnerHTML
  div.innerHTML = commentResponse.body_html;
  commentResponse.body_html = div.childNodes[0].nodeValue;

  render(
    <StickyComment commentResponse={commentResponse} />,
    div
  );

  return div.firstChild;
}
