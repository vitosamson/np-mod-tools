import { useState } from 'preact/hooks';
import { approvePost, flairPost, postSubmissionSticky, useToggleState, getCurrentUser } from '../utils';
import * as slack from '../slack';
import { PrivateSlackNoteInput } from './common';

interface Props {
  show: boolean;
  onHide: (e: Event) => void;
  onApprove: (errors: string[]) => void;
}

export default function Approval({ show, onHide, onApprove }: Props) {
  const [createStickyComment, toggleCreateStickyComment] = useToggleState(true);
  const [slackNote, setSlackNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!show) {
    return null;
  }

  const handleApproval = async () => {
    const errors: string[] = [];
    let slackMessage = `Approved by ${getCurrentUser()}`;

    if (slackNote) {
      slackMessage = `${slackMessage}\n\n> ${slackNote}`;
    }

    setIsLoading(true);

    try {
      await approvePost();
      await Promise.all([
        flairPost('').catch(err => {
          errors.push('Could not remove flair');
        }),
        slack.postSlackThreadResponse(slackMessage).catch(() => errors.push('Could not post slack thread response')),
        // removing an emoji that isn't added will error, just ignore it
        slack.removeSlackThreadEmoji(slack.emojis.rejection).catch(() => {}),
        slack.removeSlackThreadEmoji(slack.emojis.rfe).catch(() => {}),
        slack.addSlackThreadEmoji(slack.emojis.approval).catch(() => errors.push('Could not add slack emoji')),
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

      <PrivateSlackNoteInput value={slackNote} onChange={setSlackNote} />

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
