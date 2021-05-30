import { useState } from 'preact/hooks';
import { flairPost, getCurrentUser } from '../utils';
import * as slack from '../slack';
import { PrivateSlackNoteInput } from './common';

interface Props {
  show: boolean;
  onHide: (e: Event) => void;
  onRFE: (errors: string[]) => void;
}

export default function RFE({ show, onHide, onRFE }: Props) {
  const [slackNote, setSlackNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRfe = async (evt: MouseEvent) => {
    evt.preventDefault();
    const errors: string[] = [];
    let slackMessage = `RFE'd by ${getCurrentUser()}`;

    if (slackNote) {
      slackMessage = `${slackMessage}\n\n> ${slackNote}`;
    }

    setIsLoading(true);

    await Promise.all([
      flairPost('RFE').catch(err => {
        errors.push('Could not update flair');
      }),
      slack.postSlackThreadResponse(slackMessage).catch(() => errors.push('Could not post slack thread response')),
      // removing an emoji that isn't added will error, just ignore it
      slack.removeSlackThreadEmoji(slack.emojis.approval).catch(() => {}),
      slack.removeSlackThreadEmoji(slack.emojis.rejection).catch(() => {}),
      slack.addSlackThreadEmoji(slack.emojis.rfe).catch(() => errors.push('Could not add slack emoji')),
    ]);

    onRFE(errors);
    setIsLoading(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div style={{ padding: '10px 20px', fontSize: '1.2em', border: '1px solid #ccc' }}>
      <PrivateSlackNoteInput value={slackNote} onChange={setSlackNote} />

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
