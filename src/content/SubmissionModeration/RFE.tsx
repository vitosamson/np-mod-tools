import { Component } from 'preact';
import * as utils from '../utils';

interface Props {
  show: boolean;
  onHide: (e: Event) => any;
  onRFE: (errors?: string[]) => any;
}

interface State {
  sendModmail: boolean;
  loading: boolean;
}

export default class RFE extends Component<Props, State> {
  state: State = {
    sendModmail: true,
    loading: false,
  };

  rfePost = (e: Event) => {
    e.preventDefault();
    const { onRFE } = this.props;
    const { sendModmail } = this.state;
    const errors: string[] = [];
    this.setState({ loading: true });

    Promise.all([
      utils.flairPost('RFE').catch(err => {
        errors.push('Could not update flair');
      }),
      sendModmail ? utils.updateModmail('RFE').catch(err => {
        errors.push('Could not update modmail');
      }) : null,
    ]).then(() => {
      onRFE(errors.length ? errors : null);
      this.setState({ loading: false });
    });
  }

  render() {
    const { show, onHide } = this.props;
    const { sendModmail, loading } = this.state;

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
          <label for="sendModmail">Update modmail</label>
        </div>

        <div style={{ marginTop: 15 }}>
          <a href="#" className="pretty-button neutral" onClick={onHide} disabled={loading}>
            Cancel
          </a>
          <a href="#" className="pretty-button positive" onClick={this.rfePost} disabled={loading}>
            { !loading ? 'Confirm RFE' : 'Updating...' }
          </a>
        </div>
      </div>
    );
  }
}
