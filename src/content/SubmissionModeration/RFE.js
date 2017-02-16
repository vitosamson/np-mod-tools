import React, { Component, PropTypes } from 'react';
import npModUtils from '../utils';

export default class RFE extends Component {
  constructor(props) {
    super(props);
    this.rfePost = this.rfePost.bind(this);
  }

  rfePost(e) {
    const { onRFE } = this.props;
    const errors = [];
    e.preventDefault();

    Promise.all([
      npModUtils.flairPost('RFE').catch(err => {
        errors.push('Could not update flair');
      }),
      npModUtils.updateModmail('RFE').catch(err => {
        errors.push('Could not update modmail');
      }),
    ]).then(() => {
      onRFE(errors.length ? errors : null);
    });
  }

  render() {
    const { show, onHide } = this.props;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
        <a href="#" className="pretty-button neutral" onClick={onHide}>Cancel</a>
        <a href="#" className="pretty-button positive" onClick={this.rfePost}>Confirm RFE</a>

        <div style={{ marginTop: 5, color: '#98abba' }}>
          After confirming RFE, the modmail thread and flair will be updated.
        </div>
      </div>
    );
  }
}

RFE.propTypes = {
  show: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onRFE: PropTypes.func.isRequired,
};
