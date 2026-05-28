import { useState } from 'react';
import { shareOrCopy } from '../utils/share';

export default function ShareButton({
  title,
  text,
  url,
  className = 'btn btn--secondary',
  children = 'Share',
  copiedLabel = 'Copied link',
  sharedLabel = 'Shared',
}) {
  const [status, setStatus] = useState('idle');

  const handleClick = async () => {
    setStatus('working');
    const result = await shareOrCopy({ title, text, url });
    if (!result.ok) {
      setStatus('idle');
      return;
    }
    setStatus(result.method === 'share' ? 'shared' : 'copied');
    window.setTimeout(() => setStatus('idle'), 1800);
  };

  const label =
    status === 'copied'
      ? copiedLabel
      : status === 'shared'
        ? sharedLabel
        : children;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={status === 'working'}
    >
      {label}
    </button>
  );
}

