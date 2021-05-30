import { useState } from 'preact/hooks';
import { getSlackThread, postSlackThreadResponse, tsToDate } from '../slack';
import { SlackMessage } from '../types';
import { getCurrentUser, markdownToHtml } from '../utils';
import { PrivateSlackNoteInput } from './common';

interface Props {
  show: boolean;
  replies: SlackMessage[];
  onHide(e: Event): void;
  onSend(): void;
}

export default function Slack({ show, replies, onHide, onSend }: Props) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { link: slackLink } = getSlackThread();

  const handleSubmit = async (evt: MouseEvent) => {
    evt.preventDefault();

    if (!message) {
      return;
    }

    setIsLoading(true);

    try {
      await postSlackThreadResponse(`Message from ${getCurrentUser()}:\n\n> ${message}`);
      setMessage('');
      setHasError(false);
      onSend();
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div style={{ padding: '10px 20px', border: '1px solid #ccc' }}>
      {replies.map(reply => (
        <div key={reply.ts} style={{ marginBottom: 8 }}>
          {reply.user}
          <span style={{ marginLeft: 5, color: '#98abba' }}>{tsToDate(reply.ts)}</span>
          <div
            style={{
              paddingLeft: 8,
              paddingTop: 4,
            }}
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(reply.text),
            }}
          />
        </div>
      ))}

      <PrivateSlackNoteInput value={message} onChange={setMessage} showLabel={false} />

      <a className="pretty-button neutral" onClick={onHide} href="#" disabled={isLoading}>
        Close
      </a>
      <a className="pretty-button positive" onClick={handleSubmit} href="#" disabled={isLoading}>
        {!isLoading ? 'Send message' : 'Sending...'}
      </a>

      {slackLink && (
        <a href={slackLink} target="blank" style={{ float: 'right', marginTop: 5 }}>
          Open thread in Slack
        </a>
      )}

      {hasError && <div className="error">There was an error sending the message, please try again.</div>}
    </div>
  );
}
