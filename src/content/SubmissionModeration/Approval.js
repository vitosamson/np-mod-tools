import React, { Component, PropTypes } from 'react';
import npModUtils from '../utils';

export default class Approval extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createStickyComment: true,
    };
    this.approvePost = this.approvePost.bind(this);
  }

  approvePost() {
    const { createStickyComment } = this.state;
    const { onApprove } = this.props;
    const errors = [];

    npModUtils.approvePost().then(() => {
      return Promise.all([
        npModUtils.flairPost('').catch(err => {
          errors.push('Could not remove flair');
        }),
        npModUtils.updateModmail('Approved').catch(err => {
          errors.push('Could not update modmail');
        }),
        createStickyComment ? npModUtils.postSubmissionSticky().catch(err => {
          errors.push('Could not post sticky comment');
        }) : Promise.resolve(),
      ]);
    }).catch(err => {
      errors.push('Could not approve post');
    }).then(() => {
      onApprove(errors.length ? errors : null);
    });
  }

  render() {
    const { show, onHide } = this.props;
    const { createStickyComment } = this.state;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
        <input
          type="checkbox"
          style={{ marginRight: 5 }}
          checked={createStickyComment}
          name="createStickyComment"
          id="createStickyComment"
          onChange={() => this.setState({ createStickyComment: !createStickyComment })}
        />
        <label htmlFor="createStickyComment">Add sticky rule reminder</label>

        <div style={{ marginTop: 10 }}>
          <a className="pretty-button neutral" onClick={onHide} href="#">
            Cancel
          </a>
          <a className="pretty-button positive" onClick={this.approvePost} href="#">
            Approve post
          </a>
        </div>

        <div style={{ marginTop: 5, color: '#98abba' }}>
          After confirming approval, the modmail thread will be updated and the flair will be removed.
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
