import { Component } from 'preact';
import * as utils from '../utils';

interface Props {
  show: boolean;
  onHide: (e: Event) => any;
  onSend: (errors?: string[]) => any;
  replies: utils.NormalizedModmailMessage[];
}

interface State {
  message: string;
  error: boolean;
  loading: boolean;
}

export default class Modmail extends Component<Props, State> {
  textarea: HTMLElement;
  state: State = {
    message: '',
    error: false,
    loading: false,
  };

  componentDidUpdate(prevProps: Props) {
    if (this.props.show && !prevProps.show && this.textarea) {
      this.textarea.focus();
    }
  }

  setMessage = (e: KeyboardEvent) => {
    this.setState({
      message: (e.target as HTMLInputElement).value,
    });
  }

  handleKeyboardSubmit = (e: KeyboardEvent) => {
    if (e.keyCode === 13 && e.metaKey) {
      this.sendMessage(e);
    }
  }

  sendMessage = (e: Event) => {
    e.preventDefault();
    const { onSend } = this.props;
    const { message } = this.state;

    if (!message) return;
    this.setState({ loading: true });

    utils.updateModmail(message).then(() => {
      this.setState(() => ({
        message: '',
        error: false,
      }), onSend);
    }).catch(err => {
      this.setState({ error: true });
    }).then(() => {
      this.setState({ loading: false });
    });
  }

  render() {
    const { show, onHide, replies } = this.props;
    const { message, error, loading } = this.state;

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
          onInput={this.setMessage}
          onKeyDown={this.handleKeyboardSubmit}
          style={{
            width: '100%',
            maxWidth: '100%',
            display: 'block',
            marginBottom: 10,
            marginTop: 10,
          }}
          rows={5}
          ref={el => (this.textarea = (el as HTMLElement))}
        />
        <a className="pretty-button neutral" onClick={onHide} href="#" disabled={loading}>
          Close
        </a>
        <a className="pretty-button positive" onClick={this.sendMessage} href="#" disabled={loading}>
          { !loading ? 'Send message' : 'Sending...' }
        </a>

        <a href={utils.getModmailMessageLink()} style={{ float: 'right', marginTop: 5 }}>
          Full modmail thread
        </a>

        { error &&
          <div className="error">There was an error sending the message, please try again.</div>
        }
      </div>
    );
  }
}
