import React, { Component, PropTypes } from 'react';
import npModUtils from '../utils';

export default class Approval extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createStickyComment: true,
      sendModmail: true,
    };
    this.approvePost = this.approvePost.bind(this);
  }

  approvePost() {
    const { createStickyComment, sendModmail } = this.state;
    const { onApprove } = this.props;
    const errors = [];

    npModUtils.approvePost().then(() => {
      return Promise.all([
        npModUtils.flairPost('').catch(err => {
          errors.push('Could not remove flair');
        }),
        sendModmail ? npModUtils.updateModmail('Approved').catch(err => {
          errors.push('Could not update modmail');
        }) : null,
        createStickyComment ? npModUtils.postSubmissionSticky().catch(err => {
          errors.push('Could not post sticky comment');
        }) : null,
      ]);
    }).catch(err => {
      errors.push('Could not approve post');
    }).then(() => {
      onApprove(errors.length ? errors : null);
    });
  }

  render() {
    const { show, onHide } = this.props;
    const { createStickyComment, sendModmail } = this.state;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
        <div>
          <input
            type="checkbox"
            style={{ marginRight: 5 }}
            checked={createStickyComment}
            name="createStickyComment"
            id="createStickyComment"
            onChange={() => this.setState({ createStickyComment: !createStickyComment })}
          />
          <label htmlFor="createStickyComment">Add sticky rule reminder</label>
        </div>

        <div>
          <input
            type="checkbox"
            style={{ marginRight: 5, marginTop: 5 }}
            checked={sendModmail}
            name="sendModmail"
            id="sendModmail"
            onChange={() => this.setState({ sendModmail: !sendModmail })}
          />
          <label htmlFor="sendModmail">Update modmail</label>
        </div>

        <div style={{ marginTop: 10 }}>
          <a className="pretty-button neutral" onClick={onHide} href="#">
            Cancel
          </a>
          <a className="pretty-button positive" onClick={this.approvePost} href="#">
            Approve post
          </a>
        </div>
      </div>
    );
  }
}

Approval.propTypes = {
  show: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
};
