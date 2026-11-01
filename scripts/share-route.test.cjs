const assert = require('node:assert/strict');
const test = require('node:test');
const { shareKey, classicURL, mountShare } = require('../src/utils/shareRoute');

test('only exact share routes use the download UI', () => {
    assert.equal(shareKey('/s/Vdfg', '', true), 'Vdfg');
    assert.equal(shareKey('/s/Vdfg/', '?path=%252Ffolder', true), 'Vdfg');
    ['/s/Vdfg/text', '/home', '/login', '/admin', '/s/'].forEach(path => {
        assert.equal(shareKey(path, '', true), null);
    });
});

test('classic mode, malformed escapes and unsupported browsers fall back', () => {
    assert.equal(shareKey('/s/Vdfg', '?path=x&classic=1', true), null);
    assert.equal(shareKey('/s/Vdfg', '?classic=1&password=secret', true), null);
    assert.equal(shareKey('/s/%ZZ', '', true), null);
    assert.equal(shareKey('/s/Vdfg', '', false), null);
    assert.equal(shareKey('/s/Vdfg', '?classic=0', true), 'Vdfg');
});

test('fallback retains encoded paths, password parameters and fragments', () => {
    assert.equal(classicURL({pathname:'/s/id', search:'?path=%252Fa&password=abc', hash:'#item'}), '/s/id?path=%252Fa&password=abc&classic=1#item');
    assert.equal(classicURL({pathname:'/s/id', search:'', hash:''}), '/s/id?classic=1');
});

test('mount uses separate stylesheet/script and preserves fallback navigation', () => {
    const nodes = [];
    const doc = {createElement: type => ({type}), head: {appendChild: n => nodes.push(n)}, body: {appendChild: n => nodes.push(n)}};
    let redirected;
    const win = {location: {pathname:'/s/key', search:'?path=%2Fa', hash:'', replace: url => { redirected=url; }}};
    mountShare(doc, win, 'key', 'test-commit');
    assert.deepEqual(win.__shareUI, {key:'key', v:'test-commit', classicUrl:'/s/key?path=%2Fa&classic=1'});
    assert.equal(nodes[0].href, '/share-ui/share.css?v=test-commit');
    assert.equal(nodes[1].src, '/share-ui/share.js?v=test-commit');
    nodes[1].onerror();
    assert.equal(redirected, '/s/key?path=%2Fa&classic=1');
});
