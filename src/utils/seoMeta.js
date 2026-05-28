function canUseDom() {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

function ensureLink(rel) {
  let el = document.querySelector(`link[rel='${rel}']`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
}

function ensureMeta(name) {
  let el = document.querySelector(`meta[name='${name}']`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureMetaProperty(property) {
  let el = document.querySelector(`meta[property='${property}']`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  return el;
}

function setIfPresent(el, attr, value) {
  if (!el) return;
  if (value == null || value === '') return;
  el.setAttribute(attr, String(value));
}

export function setSeoMeta({
  title,
  description,
  canonicalUrl,
  robots,
  og,
  twitter,
} = {}) {
  if (!canUseDom()) return;

  if (title) document.title = title;

  if (canonicalUrl) {
    const canonical = ensureLink('canonical');
    setIfPresent(canonical, 'href', canonicalUrl);
  }

  if (robots) {
    const robotsMeta = ensureMeta('robots');
    setIfPresent(robotsMeta, 'content', robots);
  }

  if (description) {
    const desc = ensureMeta('description');
    setIfPresent(desc, 'content', description);
  }

  if (og) {
    if (og.site_name) setIfPresent(ensureMetaProperty('og:site_name'), 'content', og.site_name);
    if (og.type) setIfPresent(ensureMetaProperty('og:type'), 'content', og.type);
    if (og.title) setIfPresent(ensureMetaProperty('og:title'), 'content', og.title);
    if (og.description)
      setIfPresent(ensureMetaProperty('og:description'), 'content', og.description);
    if (og.url) setIfPresent(ensureMetaProperty('og:url'), 'content', og.url);
    if (og.image) setIfPresent(ensureMetaProperty('og:image'), 'content', og.image);
    if (og.imageWidth)
      setIfPresent(ensureMetaProperty('og:image:width'), 'content', og.imageWidth);
    if (og.imageHeight)
      setIfPresent(ensureMetaProperty('og:image:height'), 'content', og.imageHeight);
  }

  if (twitter) {
    if (twitter.card) setIfPresent(ensureMeta('twitter:card'), 'content', twitter.card);
    if (twitter.title) setIfPresent(ensureMeta('twitter:title'), 'content', twitter.title);
    if (twitter.description)
      setIfPresent(ensureMeta('twitter:description'), 'content', twitter.description);
    if (twitter.image) setIfPresent(ensureMeta('twitter:image'), 'content', twitter.image);
  }
}

