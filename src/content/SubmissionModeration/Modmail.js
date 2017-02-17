import React, { Component, PropTypes } from 'react';
import npModUtils from '../utils';

export default class Modmail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: '',
      error: false,
      replies: [],
    };
    this.setMessage = this.setMessage.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }

  setMessage(e) {
    this.setState({
      message: e.target.value,
    });
  }

  sendMessage(e) {
    e.preventDefault();
    const { onSend } = this.props;
    const { message } = this.state;

    if (!message) return;

    npModUtils.updateModmail(message).then(() => {
      this.setState({
        message: '',
        error: false,
      }, onSend);
    }).catch(err => {
      this.setState({
        error: true,
      });
    });
  }

  render() {
    const { show, onHide, replies } = this.props;
    const { message, error } = this.state;

    if (!show) return null;

    return (
      <div style={{ padding: '10px 20px', border: '1px solid #ccc' }}>
        { replies.map(reply =>
          <div key={reply.id} style={{ marginBottom: 8 }}>
            <a href={`/u/${reply.from}`}>{ reply.from }</a>
            <span style={{ marginLeft: 5, color: '#98abba' }}>
              { new Date(reply.created).toLocaleString() }
            </span>
            <div
              style={{
                paddingLeft: 8,
                paddingTop: 4,
              }}
              dangerouslySetInnerHTML={{
                __html: reply.body,
              }}
            />
          </div>
        )}

        <textarea
          value={message}
          onChange={this.setMessage}
          style={{
            width: '100%',
            maxWidth: '100%',
            display: 'block',
            marginBottom: 10,
            marginTop: 10,
          }}
          rows={5}
        />
        <a className="pretty-button neutral" onClick={onHide} href="#">
          Close
        </a>
        <a className="pretty-button positive" onClick={this.sendMessage} href="#">
          Send message
        </a>

        <a href={npModUtils.getModmailMessageLink()} style={{ float: 'right', marginTop: 5 }}>
          Full modmail thread
        </a>

        { error &&
          <div className="error">There was an error sending the message, please try again.</div>
        }
      </div>
    );
  }
}

Modmail.propTypes = {
  show: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  replies: PropTypes.array.isRequired,
};
