import { Component } from 'preact';
import Approval from './Approval';
import RFE from './RFE';
import Rejection from './Rejection';
import Modmail from './Modmail';
import * as utils from '../utils';

interface Feedback {
  type: string;
  message: string;
}

interface State {
  rules: utils.SubredditRule[];
  showApproval: boolean;
  showRFE: boolean;
  showRejection: boolean;
  showModmail: boolean;
  feedback: Feedback[];
  modmailReplies: utils.NormalizedModmailMessage[];
}

export default class SubmissionModeration extends Component<{}, State> {
  state: State = {
    rules: [],
    showApproval: false,
    showRFE: false,
    showRejection: false,
    showModmail: false,
    feedback: [],
    modmailReplies: [],
  };

  componentDidMount() {
    utils.getAccessToken().then(() => {
      this.getModmailReplies();
      utils
        .getRules()
        .then(rules => {
          this.setState({ rules });
        })
        .catch(err => {
          console.error('could not get rules', err);
        });
    });
  }

  getModmailReplies() {
    utils
      .getModmailReplies()
      .then(modmailReplies => {
        this.setState({ modmailReplies });
      })
      .catch(err => {
        console.error('could not get modmail replies', err);
        this.setState({
          feedback: [
            ...this.state.feedback,
            {
              type: 'error',
              message: 'Could not fetch modmail messages',
            },
          ],
        });
      });
  }

  toggleRejection = (e: Event) => {
    if (e) e.preventDefault();
    this.setState({
      showRejection: !this.state.showRejection,
    });
  };

  handleRejection = (errors?: string[]) => {
    if (errors && errors.length) {
      this.setState({
        feedback: errors.map(err => ({
          type: 'error',
          message: err,
        })),
      });
    } else {
      this.getModmailReplies();
      this.setState({
        feedback: [
          {
            type: 'success',
            message: 'Successfully rejected post',
          },
        ],
        showRejection: false,
      });
    }
  };

  toggleApproval = (e?: Event) => {
    if (e) e.preventDefault();
    this.setState({
      showApproval: !this.state.showApproval,
    });
  };

  handleApproval = (errors?: string[]) => {
    if (errors && errors.length) {
      this.setState({
        feedback: errors.map(err => ({
          type: 'error',
          message: err,
        })),
      });
    } else {
      this.getModmailReplies();
      this.setState({
        feedback: [
          {
            type: 'success',
            message: 'Successfully approved post',
          },
        ],
        showApproval: false,
      });
    }
  };

  toggleModmail = (e?: Event) => {
    if (e) e.preventDefault();
    this.setState({
      showModmail: !this.state.showModmail,
    });
  };

  handleSentModmail = () => {
    this.getModmailReplies();
  };

  toggleRFE = (e?: Event) => {
    if (e) e.preventDefault();
    this.setState({
      showRFE: !this.state.showRFE,
    });
  };

  handleRFE = (errors?: string[]) => {
    if (errors && errors.length) {
      this.setState({
        feedback: errors.map(err => ({
          type: 'error',
          message: err,
        })),
      });
    } else {
      this.getModmailReplies();
      this.setState({
        feedback: [
          {
            type: 'success',
            message: 'Successfully marked post as RFE',
          },
        ],
        showRFE: false,
      });
    }
  };

  render() {
    const { showApproval, showRFE, showRejection, showModmail, rules, modmailReplies, feedback } = this.state;
    const rejected = utils.postAlreadyRejected();
    const approved = utils.postAlreadyApproved();
    const RFEd = utils.postAlreadyRFEd();
    const modmailMessageLink = utils.getModmailMessageLink();

    return (
      <div style={{ marginTop: 5 }}>
        <span style={{ fontWeight: 'bold', marginLeft: 5 }}>NP Moderation:</span>

        {!approved && (
          <a href="#" className="pretty-button positive" onClick={this.toggleApproval}>
            Approve
          </a>
        )}
        {!approved && !RFEd && (
          <a href="#" className="pretty-button neutral" onClick={this.toggleRFE}>
            RFE
          </a>
        )}
        {!rejected && (
          <a href="#" className="pretty-button negative" onClick={this.toggleRejection}>
            Reject
          </a>
        )}

        {modmailMessageLink && (
          <a href="#" className="pretty-button" onClick={this.toggleModmail}>
            Modmail [{(modmailReplies && modmailReplies.length) || '0'}]
          </a>
        )}

        {!modmailMessageLink && <span style={{ marginLeft: 5, color: 'orange' }}>No trackback comment was found</span>}

        <Approval show={showApproval} onHide={this.toggleApproval} onApprove={this.handleApproval} />

        <RFE show={showRFE} onHide={this.toggleRFE} onRFE={this.handleRFE} />

        <Rejection show={showRejection} onHide={this.toggleRejection} onReject={this.handleRejection} rules={rules} />

        <Modmail
          show={showModmail}
          onHide={this.toggleModmail}
          onSend={this.handleSentModmail}
          replies={modmailReplies}
        />

        {feedback.map(f => (
          <div
            style={{
              color: f.type === 'success' ? 'green' : 'red',
            }}
          >
            {f.message}
          </div>
        ))}
      </div>
    );
  }
}
