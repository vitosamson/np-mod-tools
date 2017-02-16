import React, { Component } from 'react';

import Approval from './Approval';
import Rejection from './Rejection';
import Modmail from './Modmail';
import npModUtils from '../utils';

export default class SubmissionModeration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rules: [],
      showApproval: false,
      showReasons: false,
      showModmail: false,
      feedback: [],
      modmailReplies: [],
    };

    this.toggleReasons = this.toggleReasons.bind(this);
    this.handleRejection = this.handleRejection.bind(this);
    this.toggleApproval = this.toggleApproval.bind(this);
    this.handleApproval = this.handleApproval.bind(this);
    this.toggleSendModmail = this.toggleSendModmail.bind(this);
    this.handleSentModmail = this.handleSentModmail.bind(this);
    this.markAsRFE = this.markAsRFE.bind(this);
  }

  componentDidMount() {
    npModUtils.getAccessToken().then(() => {
      this.getModmailReplies();
      npModUtils.getRules().then(rules => {
        this.setState({ rules });
      }).catch(() => {
        console.log('could not get rules');
      });
    });
  }

  getModmailReplies() {
    npModUtils.getModmailReplies().then(replies => {
      this.setState({
        modmailReplies: replies,
      });
    }).catch(() => {
      console.log('could not get modmail replies');
    });
  }

  toggleReasons(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      showReasons: !this.state.showReasons,
    });
  }

  handleRejection(errors) {
    if (errors) {
      this.setState({
        feedback: errors.map(err => ({
          type: 'error',
          message: err,
        })),
      });
    } else {
      this.setState({
        feedback: [{
          type: 'success',
          message: 'Successfully rejected post',
        }],
        showReasons: false,
      });
      this.getModmailReplies();
    }
  }

  toggleApproval(e) {
    if (e) e.preventDefault();
    this.setState({
      showApproval: !this.state.showApproval,
    });
  }

  handleApproval(errors) {
    if (errors) {
      this.setState({
        feedback: errors.map(err => ({
          type: 'error',
          message: err,
        })),
      });
    } else {
      this.getModmailReplies();
      this.setState({
        feedback: [{
          type: 'success',
          message: 'Successfully approved post',
        }],
        showApproval: false,
      });
    }
  }

  toggleSendModmail(e) {
    if (e) e.preventDefault();
    this.setState({
      showModmail: !this.state.showModmail,
    });
  }

  handleSentModmail() {
    this.getModmailReplies();
  }

  markAsRFE(e) {
    e.preventDefault();
    const errors = [];
    Promise.all([
      npModUtils.flairPost('RFE').catch(err => {
        errors.push('Could not update flair');
      }),
      npModUtils.updateModmail('RFE').catch(err => {
        errors.push('Could not send modmail message');
      }),
    ]).then(() => {
      if (errors.length) {
        this.setState({
          feedback: errors.map(err => ({
            type: 'error',
            message: err,
          })),
        });
      } else {
        this.setState({
          feedback: [{
            type: 'success',
            message: 'Successfully marked post as RFE',
          }],
        });
      }
    });
  }

  render() {
    const { showReasons, rules, showModmail, showApproval, feedback, modmailReplies } = this.state;
    const rejected = npModUtils.postAlreadyRejected();
    const approved = npModUtils.postAlreadyApproved();
    const modmailMessageLink = npModUtils.getModmailMessageLink();

    return (
      <div style={{ marginTop: 5 }}>
        <span style={{ fontWeight: 'bold', marginLeft: 5 }}>NP Moderation:</span>

        { !approved && <a href="#" className="pretty-button positive" onClick={this.toggleApproval}>Approve</a> }
        { !approved && <a href="#" className="pretty-button neutral" onClick={this.markAsRFE}>RFE</a> }

        { !rejected &&
          <a href="#" className="pretty-button negative" onClick={this.toggleReasons}>Reject</a>
        }

        { modmailMessageLink &&
          <a href="#" className="pretty-button" onClick={this.toggleSendModmail}>Modmail</a>
        }

        { !modmailMessageLink &&
          <span style={{ marginLeft: 5, color: 'orange' }}>
            No trackback comment was found
          </span>
        }

        <Approval
          show={showApproval}
          onHide={this.toggleApproval}
          onApprove={this.handleApproval}
        />

        <Rejection
          show={!rejected && showReasons}
          rules={rules}
          onHide={this.toggleReasons}
          onReject={this.handleRejection}
        />

        <Modmail
          show={showModmail}
          onHide={this.toggleSendModmail}
          onSend={this.handleSentModmail}
          replies={modmailReplies}
        />

        { feedback.map((f, idx) =>
          <div
            key={idx}
            style={{
              color: f.type === 'success' ? 'green' : 'red',
              marginBottom: 5,
              marginLeft: 5,
            }}
          >
            { f.message }
          </div>
        )}
      </div>
    );
  }
}
