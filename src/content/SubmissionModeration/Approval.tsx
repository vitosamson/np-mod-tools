import { useState } from 'preact/hooks';
import { approvePost, flairPost, updateModmail, postSubmissionSticky, useToggleState } from '../utils';

interface Props {
  show: boolean;
  onHide: (e: Event) => void;
  onApprove: (errors: string[]) => void;
}

export default function Approval({ show, onHide, onApprove }: Props) {
  const [createStickyComment, toggleCreateStickyComment] = useToggleState(true);
  const [sendModmail, toggleSendModmail] = useToggleState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!show) {
    return null;
  }

  const handleApproval = async () => {
    const errors: string[] = [];
    setIsLoading(true);

    try {
      await approvePost();
      await Promise.all([
        flairPost('').catch(err => {
          errors.push('Could not remove flair');
        }),
        sendModmail
          ? updateModmail('Approved').catch(err => {
              errors.push('Could not update modmail');
            })
          : null,
        createStickyComment
          ? postSubmissionSticky().catch(err => {
              errors.push('Could not post sticky comment');
            })
          : null,
      ]);
    } catch (err) {
      errors.push('Could not approve post');
    } finally {
      onApprove(errors);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
      <div>
        <input
          type="checkbox"
          style={{ marginRight: 5 }}
          checked={createStickyComment}
          name="createStickyComment"
          id="createStickyComment"
          onChange={toggleCreateStickyComment}
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
          onChange={toggleSendModmail}
        />
        <label for="sendModmail">Update modmail</label>
      </div>

      <div style={{ marginTop: 10 }}>
        <a className="pretty-button neutral" onClick={onHide} href="#" disabled={isLoading}>
          Cancel
        </a>
        <a className="pretty-button positive" onClick={handleApproval} href="#" disabled={isLoading}>
          {!isLoading ? 'Approve post' : 'Approving...'}
        </a>
      </div>
    </div>
  );
}
