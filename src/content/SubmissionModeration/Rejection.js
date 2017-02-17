import React, { Component, PropTypes } from 'react';
import npModUtils from '../utils';

const getRuleLetters = reasons => {
  return Object.keys(reasons).filter(key => !!reasons[key]).map(reason =>
    reason.match(/\w:/)[0].substr(0, 1)
  ).sort();
};

const createRejectionComment = reasons => {
  let ruleLetters = getRuleLetters(reasons);
  const multipleRules = ruleLetters.length > 1;

  if (multipleRules) {
    const lastLetter = ruleLetters[ruleLetters.length - 1];
    ruleLetters = ruleLetters.slice(0, ruleLetters.length - 1).join(', ');
    ruleLetters = `${ruleLetters} and ${lastLetter}`;
  }

  return `Hello there. I'm a mod in /r/NeutralPolitics.

We appreciate your participation in the sub, but we did not approve this submission, because it doesn't conform to our [submission rules.](http://www.reddit.com/r/NeutralPolitics/wiki/guidelines#wiki_submission_rules)

Specifically, rule${multipleRules ? 's' : ''} ${ruleLetters}.

If you'd like to submit a reworked version of your post after [reviewing the guidelines,](http://www.reddit.com/r/NeutralPolitics/wiki/guidelines) we'd be happy to consider it.

Thanks for understanding.

* *Note: If you wish to discuss this topic under more relaxed submission rules, consider posting to our sister subreddit, /r/NeutralTalk.*
`;
};

export default class Rejection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedReasons: {},
      postComment: true,
      sendModmail: true,
    };
    this.confirmRejection = this.confirmRejection.bind(this);
  }

  toggleSelectedReason(rule) {
    this.setState({
      selectedReasons: Object.assign({}, this.state.selectedReasons, {
        [rule]: !this.state.selectedReasons[rule],
      }),
    });
  }

  confirmRejection(e) {
    e.preventDefault();
    const { selectedReasons, postComment, sendModmail } = this.state;
    const { onReject } = this.props;
    const hasSelectedReasons = Object.keys(selectedReasons).some(key => !!selectedReasons[key]);
    const rejectionComment = createRejectionComment(selectedReasons);

    if (hasSelectedReasons) {
      const ruleLetters = getRuleLetters(selectedReasons);
      const flair = `Rejected: ${ruleLetters.join(', ')}`;
      const errors = [];

      Promise.all([
        npModUtils.flairPost(flair).catch(err => {
          errors.push('Could not flair post');
        }),
        sendModmail ? npModUtils.updateModmail(flair).catch(err => {
          errors.push('Could not update modmail');
        }) : null,
        postComment ? npModUtils.postStickyComment(rejectionComment).catch(err => {
          errors.push('Could not post sticky comment');
        }) : null,
      ]).then(() => {
        onReject(errors.length ? errors : null);

        if (!postComment) {
          const textarea = document.querySelector('.commentarea textarea');
          textarea.value = rejectionComment;
          textarea.style.height = '440px';
          textarea.focus();
        }
      });
    }
  }

  render() {
    const { selectedReasons, postComment, sendModmail } = this.state;
    const { show, rules, onHide } = this.props;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
        { !rules.length &&
          <div className="error">
            This subreddit has no rules!
          </div>
        }

        { rules.map((rule, idx) =>
          <div key={idx} style={{ marginBottom: 5 }}>
            <input
              type="checkbox"
              checked={selectedReasons[rule.short_name] === true}
              onChange={() => this.toggleSelectedReason(rule.short_name)}
              name={rule.short_name}
              id={rule.short_name}
              style={{ marginRight: 5 }}
            />
            <label htmlFor={rule.short_name}>{ rule.short_name }</label>
          </div>
        )}

        <div>
          <input
            type="checkbox"
            checked={postComment}
            onChange={() => this.setState({ postComment: !postComment })}
            name="postComment"
            id="postComment"
            style={{ marginRight: 5, marginTop: 10 }}
          />
          <label htmlFor="postComment">Automatically post rejection comment</label>
        </div>

        <div>
          <input
            type="checkbox"
            checked={sendModmail}
            onChange={() => this.setState({ sendModmail: !sendModmail })}
            name="sendModmail"
            id="sendModmail"
            style={{ marginRight: 5, marginTop: 5 }}
          />
          <label htmlFor="sendModmail">Update modmail</label>
        </div>

        <div style={{ marginTop: 15 }}>
          <a href="#" className="pretty-button neutral" onClick={onHide}>Cancel</a>
          <a href="#" className="pretty-button negative" onClick={this.confirmRejection}>
            Confirm rejection
          </a>
        </div>
      </div>
    );
  }
}

Rejection.propTypes = {
  show: PropTypes.bool,
  rules: PropTypes.arrayOf(PropTypes.object).isRequired,
  onHide: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
