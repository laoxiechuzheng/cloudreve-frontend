function shareKey(pathname, search, modern) {
    if (!modern || /(^|&)classic=1(&|$)/.test(search.slice(1))) return null;
    const match = pathname.match(/^\/s\/([^/]+)\/?$/);
    try {
        return match ? decodeURIComponent(match[1]) : null;
    } catch (_) {
        return null;
    }
}

function classicURL(location) {
    return location.pathname + (location.search || '') +
        (location.search ? '&' : '?') + 'classic=1' + (location.hash || '');
}

function mountShare(doc, win, key, version) {
    const fallback = classicURL(win.location);
    win.__shareUI = { key, v: version, classicUrl: fallback };
    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/share-ui/share.css?v=' + encodeURIComponent(version);
    doc.head.appendChild(style);
    const script = doc.createElement('script');
    script.src = '/share-ui/share.js?v=' + encodeURIComponent(version);
    script.onerror = () => win.location.replace(fallback);
    doc.body.appendChild(script);
}

module.exports = { shareKey, classicURL, mountShare };
