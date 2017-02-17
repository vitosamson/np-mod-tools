import React, { Component, PropTypes } from 'react';
import npModUtils from '../utils';

export default class RFE extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sendModmail: true,
    };
    this.rfePost = this.rfePost.bind(this);
  }

  rfePost(e) {
    const { onRFE } = this.props;
    const { sendModmail } = this.state;
    const errors = [];
    e.preventDefault();

    Promise.all([
      npModUtils.flairPost('RFE').catch(err => {
        errors.push('Could not update flair');
      }),
      sendModmail ? npModUtils.updateModmail('RFE').catch(err => {
        errors.push('Could not update modmail');
      }) : null,
    ]).then(() => {
      onRFE(errors.length ? errors : null);
    });
  }

  render() {
    const { show, onHide } = this.props;
    const { sendModmail } = this.state;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
        <div>
          <input
            type="checkbox"
            checked={sendModmail}
            onChange={() => this.setState({ sendModmail: !sendModmail })}
            name="sendModmail"
            id="sendModmail"
            style={{ marginRight: 5, marginTop: 10 }}
          />
          <label htmlFor="sendModmail">Update modmail</label>
        </div>

        <div style={{ marginTop: 15 }}>
          <a href="#" className="pretty-button neutral" onClick={onHide}>Cancel</a>
          <a href="#" className="pretty-button positive" onClick={this.rfePost}>Confirm RFE</a>
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
