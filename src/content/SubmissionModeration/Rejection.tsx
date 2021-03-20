import { Component } from 'preact';
import * as utils from '../utils';

interface Props {
  show: boolean;
  rules: utils.SubredditRule[];
  onHide: (e: Event) => void;
  onReject: (errors?: string[]) => void;
}

interface SelectedReasons {
  [reason: string]: boolean;
}

interface State {
  selectedReasons: SelectedReasons;
  postComment: boolean;
  sendModmail: boolean;
  removeFromQueue: boolean;
  loading: boolean;
}

const getRuleLetters = (reasons: SelectedReasons) => {
  return Object.keys(reasons)
    .filter(key => !!reasons[key])
    .map(reason => reason.match(/\w:/)[0].substr(0, 1))
    .sort();
};

const createRejectionComment = (reasons: SelectedReasons) => {
  let ruleLetters: string | string[] = getRuleLetters(reasons);
  const multipleRules = ruleLetters.length > 1;

  if (multipleRules) {
    const lastLetter = ruleLetters[ruleLetters.length - 1];
    ruleLetters = ruleLetters.slice(0, ruleLetters.length - 1).join(', ');
    ruleLetters = `${ruleLetters} and ${lastLetter}`;
  } else {
    ruleLetters = ruleLetters.join('');
  }

  // TODO: externalize this - wiki?
  return `Hello there. I'm a mod in /r/NeutralPolitics.

We appreciate your participation in the sub, but we did not approve this submission, because it doesn't conform to our [submission rules.](http://www.reddit.com/r/NeutralPolitics/wiki/guidelines#wiki_submission_rules)

Specifically, rule${multipleRules ? 's' : ''} ${ruleLetters}.

If you'd like to submit a reworked version of your post after [reviewing the guidelines,](http://www.reddit.com/r/NeutralPolitics/wiki/guidelines) we'd be happy to consider it.

Thanks for understanding.

* *Note: If you wish to discuss this topic under more relaxed submission rules, consider posting to our sister subreddit, /r/NeutralTalk.*
`;
};

export default class Rejection extends Component<Props, State> {
  state: State = {
    selectedReasons: {},
    postComment: true,
    sendModmail: true,
    removeFromQueue: true,
    loading: false,
  };

  toggleSelectedReason = (rule: string) => {
    this.setState({
      selectedReasons: {
        ...this.state.selectedReasons,
        [rule]: !this.state.selectedReasons[rule],
      },
    });
  };

  confirmRejection = async (e: Event) => {
    e.preventDefault();
    const { selectedReasons, postComment, sendModmail, removeFromQueue } = this.state;
    const { onReject } = this.props;
    const hasSelectedReasons = Object.keys(selectedReasons).some(key => !!selectedReasons[key]);
    const rejectionComment = createRejectionComment(selectedReasons);

    if (hasSelectedReasons) {
      const ruleLetters = getRuleLetters(selectedReasons);
      const flair = `${ruleLetters.join(', ')}`;
      const modmail = `Rejected: ${flair}`;
      const errors: string[] = [];
      this.setState({ loading: true });

      await Promise.all([
        utils.flairPost(flair).catch(err => {
          errors.push('Could not flair post');
        }),
        sendModmail
          ? utils.updateModmail(modmail).catch(err => {
              errors.push('Could not update modmail');
            })
          : null,
        postComment
          ? utils.postStickyComment(rejectionComment).catch(err => {
              errors.push('Could not post sticky comment');
            })
          : null,
        removeFromQueue
          ? utils.removePost().catch(err => {
              errors.push('Could not remove post from queue');
            })
          : null,
      ]);

      onReject(errors.length ? errors : null);
      this.setState({ loading: false });

      if (!postComment) {
        const textarea = document.querySelector('.commentarea textarea') as HTMLTextAreaElement;
        textarea.value = rejectionComment;
        textarea.style.height = '440px';
        textarea.focus();
      }
    }
  };

  render() {
    const { selectedReasons, postComment, sendModmail, removeFromQueue, loading } = this.state;
    const { show, rules, onHide } = this.props;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
        {!rules.length && <div className="error">This subreddit has no rules!</div>}

        {rules.map((rule, idx) => (
          <div style={{ marginBottom: 5 }}>
            <input
              type="checkbox"
              checked={selectedReasons[rule.short_name] === true}
              onChange={() => this.toggleSelectedReason(rule.short_name)}
              name={rule.short_name}
              id={rule.short_name}
              style={{ marginRight: 5 }}
            />
            <label for={rule.short_name}>{rule.short_name}</label>
          </div>
        ))}

        <div>
          <input
            type="checkbox"
            checked={postComment}
            onChange={() => this.setState({ postComment: !postComment })}
            name="postComment"
            id="postComment"
            style={{ marginRight: 5, marginTop: 10 }}
          />
          <label for="postComment">Post rejection comment</label>
        </div>

        <div>
          <input
            type="checkbox"
            checked={removeFromQueue}
            onChange={() => this.setState({ removeFromQueue: !removeFromQueue })}
            name="removeFromQueue"
            id="removeFromQueue"
            style={{ marginRight: 5, marginTop: 5 }}
          />
          <label for="removeFromQueue">Remove post from queue</label>
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
          <label for="sendModmail">Update modmail</label>
        </div>

        <div style={{ marginTop: 15 }}>
          <a href="#" className="pretty-button neutral" onClick={onHide} disabled={loading}>
            Cancel
          </a>
          <a href="#" className="pretty-button negative" onClick={this.confirmRejection} disabled={loading}>
            {!loading ? 'Confirm rejection' : 'Rejecting...'}
          </a>
        </div>
      </div>
    );
  }
}
