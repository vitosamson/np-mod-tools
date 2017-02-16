import React, { Component } from 'react';

import Approval from './Approval';
import RFE from './RFE';
import Rejection from './Rejection';
import Modmail from './Modmail';
import npModUtils from '../utils';

export default class SubmissionModeration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rules: [],
      showApproval: false,
      showRFE: false,
      showRejection: false,
      showModmail: false,
      feedback: [],
      modmailReplies: [],
    };

    this.toggleRejection = this.toggleRejection.bind(this);
    this.handleRejection = this.handleRejection.bind(this);
    this.toggleApproval = this.toggleApproval.bind(this);
    this.handleApproval = this.handleApproval.bind(this);
    this.toggleSendModmail = this.toggleSendModmail.bind(this);
    this.handleSentModmail = this.handleSentModmail.bind(this);
    this.toggleRFE = this.toggleRFE.bind(this);
    this.handleRFE = this.handleRFE.bind(this);
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

  toggleRejection(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      showRejection: !this.state.showRejection,
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
        showRejection: false,
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

  toggleRFE(e) {
    e.preventDefault();
    this.setState({
      showRFE: !this.state.showRFE,
    });
  }

  handleRFE(errors) {
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
          message: 'Successfully marked post as RFE',
        }],
        showRFE: false,
      });
    }
  }

  render() {
    const { showRejection, rules, showModmail, showApproval, feedback, modmailReplies, showRFE } = this.state;
    const rejected = npModUtils.postAlreadyRejected();
    const approved = npModUtils.postAlreadyApproved();
    const RFEd = npModUtils.postAlreadyRFEd();
    const modmailMessageLink = npModUtils.getModmailMessageLink();

    return (
      <div style={{ marginTop: 5 }}>
        <span style={{ fontWeight: 'bold', marginLeft: 5 }}>NP Moderation:</span>

        { !approved && <a href="#" className="pretty-button positive" onClick={this.toggleApproval}>Approve</a> }
        { (!approved && !RFEd) && <a href="#" className="pretty-button neutral" onClick={this.toggleRFE}>RFE</a> }

        { !rejected &&
          <a href="#" className="pretty-button negative" onClick={this.toggleRejection}>Reject</a>
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

        <RFE
          show={showRFE}
          onHide={this.toggleRFE}
          onRFE={this.handleRFE}
        />

        <Rejection
          show={!rejected && showRejection}
          rules={rules}
          onHide={this.toggleRejection}
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
