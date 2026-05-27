function canUseDom() {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

export function getCanonicalUrl() {
  if (!canUseDom()) return null;
  const el = document.querySelector("link[rel='canonical']");
  const href = el?.getAttribute('href');
  if (!href) return null;
  return href;
}

export function upsertJsonLdScript(id, json) {
  if (!canUseDom()) return;
  const scriptId = String(id || '').trim();
  if (!scriptId) return;

  if (!json) {
    const existing = document.getElementById(scriptId);
    if (existing?.parentNode) existing.parentNode.removeChild(existing);
    return;
  }

  let el = document.getElementById(scriptId);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('id', scriptId);
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  } else if (el.tagName.toLowerCase() !== 'script') {
    // Defensive: avoid clobbering unexpected DOM.
    return;
  } else {
    el.setAttribute('type', 'application/ld+json');
  }

  const nextText = JSON.stringify(json);
  if (el.textContent !== nextText) {
    el.textContent = nextText;
  }
}

