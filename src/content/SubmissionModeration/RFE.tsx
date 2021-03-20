import { useState } from 'preact/hooks';
import { flairPost, updateModmail, useToggleState } from '../utils';

interface Props {
  show: boolean;
  onHide: (e: Event) => void;
  onRFE: (errors: string[]) => void;
}

export default function RFE({ show, onHide, onRFE }: Props) {
  const [sendModmail, toggleSendModmail] = useToggleState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleRfe = async (evt: MouseEvent) => {
    evt.preventDefault();
    const errors: string[] = [];

    setIsLoading(true);

    await Promise.all([
      flairPost('RFE').catch(err => {
        errors.push('Could not update flair');
      }),
      sendModmail
        ? updateModmail('RFE').catch(err => {
            errors.push('Could not update modmail');
          })
        : null,
    ]);

    onRFE(errors);
    setIsLoading(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
      <div>
        <input
          type="checkbox"
          checked={sendModmail}
          onChange={toggleSendModmail}
          name="sendModmail"
          id="sendModmail"
          style={{ marginRight: 5, marginTop: 10 }}
        />
        <label for="sendModmail">Update modmail</label>
      </div>

      <div style={{ marginTop: 15 }}>
        <a href="#" className="pretty-button neutral" onClick={onHide} disabled={isLoading}>
          Cancel
        </a>
        <a href="#" className="pretty-button positive" onClick={handleRfe} disabled={isLoading}>
          {!isLoading ? 'Confirm RFE' : 'Updating...'}
        </a>
      </div>
    </div>
  );
}
