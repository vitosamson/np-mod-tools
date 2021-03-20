import { useEffect, useRef, useState } from 'preact/hooks';
import { getModmailMessageLink, updateModmail, NormalizedModmailMessage } from '../utils';

interface Props {
  show: boolean;
  onHide: (e: Event) => void;
  onSend: () => void;
  replies: NormalizedModmailMessage[];
}

export default function Modmail({ show, replies, onHide, onSend }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const modmailThreadUrl = getModmailMessageLink();

  useEffect(() => {
    if (show) {
      textareaRef.current?.focus();
    }
  }, [show]);

  const handleSubmit = async (evt?: MouseEvent) => {
    if (evt) {
      evt.preventDefault();
    }

    if (!message) {
      return;
    }

    setIsLoading(true);

    try {
      await updateModmail(message);
      setMessage('');
      setHasError(false);
    } catch (err) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyboardSubmit = (evt: KeyboardEvent) => {
    if (evt.key === 'Enter' || (evt.key === 'Return' && (evt.metaKey || evt.ctrlKey))) {
      evt.preventDefault();
      handleSubmit();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div style={{ padding: '10px 20px', border: '1px solid #ccc' }}>
      {replies.map(reply => (
        <div key={reply.id} style={{ marginBottom: 8 }}>
          <a href={`/u/${reply.from}`}>{reply.from}</a>
          <span style={{ marginLeft: 5, color: '#98abba' }}>{new Date(reply.created).toLocaleString()}</span>
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
      ))}

      <textarea
        value={message}
        onInput={evt => setMessage(evt.currentTarget.value)}
        onKeyDown={handleKeyboardSubmit}
        style={{
          width: '100%',
          maxWidth: '100%',
          display: 'block',
          marginBottom: 10,
          marginTop: 10,
        }}
        rows={5}
        ref={textareaRef}
      />
      <a className="pretty-button neutral" onClick={onHide} href="#" disabled={isLoading}>
        Close
      </a>
      <a className="pretty-button positive" onClick={handleSubmit} href="#" disabled={isLoading}>
        {!isLoading ? 'Send message' : 'Sending...'}
      </a>

      {modmailThreadUrl && (
        <a href={modmailThreadUrl} style={{ float: 'right', marginTop: 5 }}>
          Full modmail thread
        </a>
      )}

      {hasError && <div className="error">There was an error sending the message, please try again.</div>}
    </div>
  );
}
