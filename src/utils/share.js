export function canUseDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export async function copyToClipboard(text) {
  const value = String(text ?? '');
  if (!value) return false;
  if (!canUseDom()) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', 'true');
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return Boolean(ok);
  } catch {
    return false;
  }
}

export async function shareOrCopy({ title, text, url }) {
  const shareTitle = title ? String(title) : undefined;
  const shareText = text ? String(text) : undefined;
  const shareUrl = url ? String(url) : undefined;

  if (!canUseDom()) return { method: 'none', ok: false };

  try {
    if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return { method: 'share', ok: true };
    }
  } catch {
    // If user cancels share, fall through to copy.
  }

  const toCopy = shareUrl || `${shareTitle ?? ''}\n${shareText ?? ''}`.trim();
  const ok = await copyToClipboard(toCopy);
  return { method: 'copy', ok };
}

