import { Component } from 'preact';
import * as utils from '../utils';

interface Props {
  show: boolean;
  onHide: (e: Event) => void;
  onApprove: (errors?: string[]) => void;
}

interface State {
  createStickyComment: boolean;
  sendModmail: boolean;
  loading: boolean;
}

export default class Approval extends Component<Props, State> {
  state: State = {
    createStickyComment: true,
    sendModmail: true,
    loading: false,
  };

  approvePost = async () => {
    const { createStickyComment, sendModmail } = this.state;
    const { onApprove } = this.props;
    const errors: string[] = [];
    this.setState({ loading: true });

    try {
      await utils.approvePost();
      await Promise.all([
        utils.flairPost('').catch(err => {
          errors.push('Could not remove flair');
        }),
        sendModmail
          ? utils.updateModmail('Approved').catch(err => {
              errors.push('Could not update modmail');
            })
          : null,
        createStickyComment
          ? utils.postSubmissionSticky().catch(err => {
              errors.push('Could not post sticky comment');
            })
          : null,
      ]);
    } catch (err) {
      errors.push('Could not approve post');
    } finally {
      onApprove(errors.length ? errors : null);
      this.setState({ loading: false });
    }
  };

  render() {
    const { show, onHide } = this.props;
    const { createStickyComment, sendModmail, loading } = this.state;

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
          <label for="createStickyComment">Add sticky rule reminder</label>
        </div>

        <div>
          <input
            type="checkbox"
            style={{ marginRight: 5, marginTop: 5 }}
            checked={sendModmail}
            name="sendModmail"
            id="sendModmail"
            onChange={() => this.setState((state: State) => ({ sendModmail: !state.sendModmail }))}
          />
          <label for="sendModmail">Update modmail</label>
        </div>

        <div style={{ marginTop: 10 }}>
          <a className="pretty-button neutral" onClick={onHide} href="#" disabled={loading}>
            Cancel
          </a>
          <a className="pretty-button positive" onClick={this.approvePost} href="#" disabled={loading}>
            {!loading ? 'Approve post' : 'Approving...'}
          </a>
        </div>
      </div>
    );
  }
}
