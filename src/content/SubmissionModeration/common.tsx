interface PrivateSlackNoteProps {
  value: string;
  showLabel?: boolean;
  onChange(value: string): void;
}

export const PrivateSlackNoteInput = ({ value, showLabel = true, onChange }: PrivateSlackNoteProps) => {
  return (
    <div style={{ marginTop: 10 }}>
      {showLabel && 'Private note to include in Slack thread (optional):'}
      <textarea
        value={value}
        onInput={evt => onChange(evt.currentTarget.value)}
        style={{
          width: '100%',
          maxWidth: '100%',
          display: 'block',
          marginBottom: 10,
          marginTop: 5,
        }}
        rows={3}
      />
    </div>
  );
};
