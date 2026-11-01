/*
 * share-ui：Cloudreve 3.8.3 分享页（/s/:id）的下载界面。
 *
 * statics/index.html 只在 /s/:id 上加载本脚本，替代原 React 分享页；其余路由、预览子路由
 * （/s/:id/text 等）以及带 ?classic=1 的请求仍走原版前端。这里只调用 Cloudreve 原有的
 * /api/v3 接口，不改动数据和链接格式，目录导航沿用原版的 ?path= 参数。
 */
(() => {
  'use strict';

  const KEY = window.__shareUI.key;
  const CLASSIC_URL = window.__shareUI.classicUrl || `${location.pathname}?classic=1`;
  const API = '/api/v3';
  const NOTE_MAX = 256 * 1024; // 不超过此大小的 txt/md 置顶为「使用说明」，可展开查看
  const FILTER_MIN = 9; // 条目多于此数时显示筛选框

  // 文案取自原版前端 locales/zh-CN/common.json 的 errors
  const ERRORS = {
    401: '请先登录',
    403: '此操作被禁止',
    404: '资源不存在',
    40005: '签名过期，请刷新页面后重试',
    40007: '当前用户组无法进行此操作',
    40016: '路径不存在',
    40044: '文件不存在',
    40058: '分享不存在或已过期',
    40069: '提取码不正确',
    40070: '此分享无法预览',
    50001: '服务器数据库操作失败',
    50002: '下载链接签名失败',
    50004: '服务器读写失败',
    50005: '服务器内部错误',
    50010: '存储节点不可用',
  };

  // rank 决定同名多格式文件里谁是主按钮：安装程序 < 其他 < 压缩包
  const KINDS = [
    { key: 'win', label: 'Windows 安装程序', rank: 0, exts: ['exe', 'msi'] },
    { key: 'android', label: '安卓安装包', rank: 0, exts: ['apk', 'apks', 'xapk'] },
    { key: 'mac', label: 'macOS 安装包', rank: 0, exts: ['dmg', 'pkg'] },
    { key: 'ios', label: 'iOS 安装包', rank: 0, exts: ['ipa'] },
    { key: 'linux', label: 'Linux 安装包', rank: 0, exts: ['deb', 'rpm', 'appimage'] },
    { key: 'archive', label: '压缩包', rank: 2, exts: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'] },
    { key: 'text', label: '文本文档', rank: 1, exts: ['txt', 'md', 'log'] },
    { key: 'config', label: '配置文件', rank: 1, exts: ['conf', 'yaml', 'yml', 'json', 'ini', 'toml'] },
    { key: 'image', label: '图片', rank: 1, exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic'] },
    { key: 'video', label: '视频', rank: 1, exts: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'] },
    { key: 'audio', label: '音频', rank: 1, exts: ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'aac'] },
    { key: 'pdf', label: 'PDF 文档', rank: 1, exts: ['pdf'] },
    { key: 'doc', label: 'Office 文档', rank: 1, exts: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] },
  ];
  const KIND_BY_EXT = {};
  KINDS.forEach((k) => k.exts.forEach((e) => { KIND_BY_EXT[e] = k; }));
  const OTHER_KIND = { key: 'other', label: '文件', rank: 1 };

  const ICONS = {
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 18.2 8.6 4.5 4.5 0 0 1 17.5 18.5z"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2.2h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    file: '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5"/>',
    doc: '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4"/>',
    download: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    chevron: '<path d="m9.5 6 6 6-6 6"/>',
    'chevron-down': '<path d="m6 9.5 6 6 6-6"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    files: '<path d="M8 3.5h6.5L19 8v9.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2z"/><path d="M14.5 3.5V8H19"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  };

  const root = document.getElementById('root');
  const state = {
    config: null,
    info: null,
    path: '/',
    objects: [],
    loading: false,
    error: null,
    filter: '',
    seq: 0,
    files: new Map(), // 按钮 data-* 里的 id → 文件对象
  };

  class ApiError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const apiError = (code, msg) => new ApiError(code, ERRORS[code] || msg || `请求失败（错误码 ${code}）`);

  async function api(method, path, body) {
    let res;
    try {
      res = await fetch(API + path, {
        method,
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError(-1, '网络连接失败，请检查网络后重试');
    }
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new ApiError(res.status, `服务器响应异常（HTTP ${res.status}）`);
    }
    // 203 是 Cloudreve 的「部分成功」，与原版前端一致视为成功
    if (json.code !== 0 && json.code !== 203) throw apiError(json.code, json.msg);
    return json.data;
  }

  // ---------- 工具 ----------

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const icon = (name, cls) => `<svg class="su-ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

  function fmtSize(n) {
    if (!(n >= 1024)) return `${n || 0} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let i = -1;
    do {
      n /= 1024;
      i += 1;
    } while (n >= 1024 && i < units.length - 1);
    return `${n.toFixed(1)} ${units[i]}`;
  }

  function fmtDate(s) {
    const d = new Date(s);
    if (!s || Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return '';
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  const fmtNum = (n) => Number(n || 0).toLocaleString('zh-CN');

  // 与原版前端一致：分享内文件的完整路径
  const fullPath = (o) => (o.path === '/' ? `/${o.name}` : `${o.path}/${o.name}`);

  // 兼容原版前端写入的 ?path=%252F...（二次编码）
  function normalizePath(raw) {
    let p = raw || '/';
    if (/^%2f/i.test(p)) {
      try { p = decodeURIComponent(p); } catch (e) { p = '/'; }
    }
    if (p[0] !== '/') p = `/${p}`;
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p || '/';
  }

  const dirUrl = (p) => location.pathname + (p === '/' ? '' : `?path=${encodeURIComponent(p)}`);

  function describe(o) {
    const dot = o.name.lastIndexOf('.');
    const ext = dot > 0 ? o.name.slice(dot + 1).toLowerCase() : '';
    return Object.assign({}, o, {
      ext,
      base: dot > 0 ? o.name.slice(0, dot) : o.name,
      kind: KIND_BY_EXT[ext] || OTHER_KIND,
    });
  }

  const collator = typeof Intl !== 'undefined' && Intl.Collator
    ? new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })
    : { compare: (a, b) => (a < b ? -1 : a > b ? 1 : 0) };

  const siteTitle = () => (state.config && state.config.title) || window.subTitle || '文件分享';

  // 输入已转义；URL 只取 ASCII 字符，并在转义后的引号/尖括号和句尾标点处截断
  function linkify(escaped) {
    return escaped.replace(/https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+/g, (m) => {
      const cut = m.search(/&(?:quot|lt|gt|#39);/);
      let url = cut >= 0 ? m.slice(0, cut) : m;
      url = url.replace(/[.,:!?)\]]+$/, '');
      if (url.length < 11) return m;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${m.slice(url.length)}`;
    });
  }

  // 下载接口返回带 Content-Disposition: attachment 的签名链接，用 <a download> 触发不会离开本页
  function triggerDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function decodeText(buf) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch (e) {
      try { return new TextDecoder('gbk').decode(buf); } catch (e2) { return new TextDecoder().decode(buf); }
    }
  }

  let toastTimer;
  function toast(msg, type) {
    let el = document.querySelector('.su-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'su-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.dataset.type = type || 'info';
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 3600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  // 微信、QQ 等内置浏览器通常会拦截安装包下载
  function inAppName() {
    const ua = navigator.userAgent;
    if (/MicroMessenger/i.test(ua)) return '微信';
    if (/\sQQ\//i.test(ua)) return 'QQ';
    if (/Weibo/i.test(ua)) return '微博';
    if (/DingTalk/i.test(ua)) return '钉钉';
    return '';
  }

  // ---------- 渲染：公共部分 ----------

  function badge(f, cls) {
    const label = f.ext && f.ext.length <= 4 ? esc(f.ext.toUpperCase()) : icon('file');
    return `<span class="su-badge${cls ? ` ${cls}` : ''}" data-kind="${f.kind.key}">${label}</span>`;
  }

  const chip = (name, text) => `<span class="su-chip">${icon(name)}${text}</span>`;

  function banner() {
    const app = inAppName();
    if (!app) return '';
    return `<div class="su-banner" role="note">${icon('alert')}<div><b>${app}内置浏览器可能无法下载文件</b>`
      + '请点击右上角「···」，选择「在浏览器中打开」后再下载。</div>'
      + '<button type="button" class="su-btn su-btn-sm su-btn-soft" data-copy-link>复制本页链接</button></div>';
  }

  function render({ heroIcon, title, meta, body }) {
    root.innerHTML = `<div class="su-app">
  <header class="su-hero"><div class="su-wrap">
    <div class="su-top">${icon('cloud')}<span>${esc(siteTitle())}</span></div>
    <div class="su-hero-main">
      <div class="su-hero-icon">${heroIcon}</div>
      <div class="su-hero-text"><h1>${title}</h1><div class="su-hero-meta">${meta || ''}</div></div>
    </div>
  </div></header>
  <main class="su-wrap su-main">${banner()}${body}</main>
  <footer class="su-wrap su-foot"><a href="${esc(CLASSIC_URL)}">切换到经典界面</a></footer>
</div>`;
  }

  const skeletonRows = (n) => '<div class="su-skel-row"><span class="su-skel su-skel-badge"></span><span class="su-skel su-skel-line"></span></div>'.repeat(n);

  function renderLoading() {
    render({
      heroIcon: icon('cloud'),
      title: '<span class="su-skel su-skel-title"></span>',
      meta: '<span class="su-skel su-skel-meta"></span>',
      body: `<section class="su-card su-card-pad">${skeletonRows(3)}</section>`,
    });
  }

  function renderError(err) {
    const missing = err.code === 40058 || err.code === 404;
    document.title = `${missing ? '分享不存在' : '加载失败'} - ${siteTitle()}`;
    render({
      heroIcon: icon('alert'),
      title: missing ? '分享不存在或已失效' : '页面加载失败',
      body: `<section class="su-card"><div class="su-empty">${icon(missing ? 'files' : 'alert')}
        <p>${missing ? '链接可能已被取消、已过期或不完整，请向分享者确认。' : esc(err.message)}</p>
        ${missing ? '' : '<button type="button" class="su-btn su-btn-primary" data-reload>重新加载</button>'}
      </div></section>`,
    });
  }

  // ---------- 加密分享 ----------

  function renderLocked(error) {
    const nick = state.info.creator && state.info.creator.nick;
    document.title = `加密分享 - ${siteTitle()}`;
    render({
      heroIcon: icon('lock'),
      title: `${nick ? `${esc(nick)} 的` : ''}加密分享`,
      meta: chip('lock', '输入提取码后即可查看和下载'),
      body: `<section class="su-card su-card-pad">
        <form class="su-lock-form" autocomplete="off" novalidate>
          <label class="su-label" for="su-pwd">提取码</label>
          <div class="su-input-row">
            <input id="su-pwd" class="su-input" name="password" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="请输入提取码">
            <button type="submit" class="su-btn su-btn-primary">${icon('unlock')}<span>提取文件</span></button>
          </div>
          <p class="su-error" role="alert">${esc(error || '')}</p>
        </form>
      </section>`,
    });
    const input = root.querySelector('#su-pwd');
    if (input) input.focus();
  }

  async function unlock(form) {
    const input = form.elements.password;
    const errorEl = form.querySelector('.su-error');
    const pwd = input.value.trim();
    if (!pwd) {
      errorEl.textContent = '请输入提取码';
      input.focus();
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    setBusy(btn, '验证中…');
    try {
      const info = await api('GET', `/share/info/${encodeURIComponent(KEY)}?password=${encodeURIComponent(pwd)}`);
      if (info.locked) {
        errorEl.textContent = '提取码不正确，请重新输入';
        input.select();
        return;
      }
      state.info = info;
      openShare();
    } catch (e) {
      errorEl.textContent = e.message;
    } finally {
      if (btn.isConnected) restore(btn);
    }
  }

  // ---------- 目录分享 ----------

  function classify(objects) {
    const folders = [];
    const notes = [];
    const groups = new Map();
    objects.forEach((o) => {
      if (o.type === 'dir') {
        folders.push(o);
        return;
      }
      const f = describe(o);
      state.files.set(f.id, f);
      if (f.kind.key === 'text' && f.size <= NOTE_MAX) {
        notes.push(f);
        return;
      }
      // 同名不同格式（如 xxx.exe / xxx.rar）合并成一项，提供多个下载按钮
      const k = f.base.toLowerCase();
      if (!groups.has(k)) groups.set(k, { base: f.base, files: [] });
      groups.get(k).files.push(f);
    });
    const list = Array.from(groups.values());
    list.forEach((g) => g.files.sort((a, b) => a.kind.rank - b.kind.rank || collator.compare(a.ext, b.ext)));
    list.sort((a, b) => collator.compare(a.base, b.base));
    folders.sort((a, b) => collator.compare(a.name, b.name));
    notes.sort((a, b) => collator.compare(a.name, b.name));
    return { folders, notes, groups: list };
  }

  function noteHtml(f, label) {
    return `<div class="su-note${f.kind.key === 'config' ? ' su-note-mono' : ''}">
      <div class="su-note-head">
        <span class="su-note-icon">${icon('doc')}</span>
        <div class="su-note-info"><div class="su-note-title">${esc(f.base)}</div><div class="su-note-sub">${label} · ${esc(f.ext.toUpperCase())} · ${fmtSize(f.size)}</div></div>
        <button type="button" class="su-btn su-btn-sm su-btn-note" data-note="${esc(f.id)}" aria-expanded="false"><span class="su-closed-label">查看</span><span class="su-open-label">收起</span>${icon('chevron-down', 'su-caret')}</button>
      </div>
      <div class="su-note-body"><div class="su-note-text"></div>
        <div class="su-note-foot"><button type="button" class="su-link" data-dl="${esc(f.id)}">${icon('download')}<span>下载此文件</span></button></div>
      </div>
    </div>`;
  }

  function folderHtml(o) {
    const p = fullPath(o);
    const date = fmtDate(o.date);
    return `<li><a class="su-item" href="${esc(dirUrl(p))}" data-nav="${esc(p)}">
      <span class="su-badge" data-kind="folder">${icon('folder')}</span>
      <div class="su-item-body"><div class="su-item-name">${esc(o.name)}</div><div class="su-item-meta">文件夹${date ? ` · ${date}` : ''}</div></div>
      ${icon('chevron', 'su-item-go')}
    </a></li>`;
  }

  function groupHtml(g) {
    const main = g.files[0];
    const multi = g.files.length > 1;
    const meta = [main.kind.label, fmtSize(main.size), fmtDate(main.date)].filter(Boolean).join(' · ');
    const buttons = g.files.map((f, i) => {
      const text = multi && f.ext ? `下载 .${esc(f.ext)}` : '下载';
      return `<button type="button" class="su-btn ${i === 0 ? 'su-btn-primary' : 'su-btn-outline'}" data-dl="${esc(f.id)}" title="${esc(f.name)}（${fmtSize(f.size)}）">${icon('download')}<span>${text}</span></button>`;
    }).join('');
    return `<li><div class="su-item">
      ${badge(main)}
      <div class="su-item-body"><div class="su-item-name" title="${esc(main.name)}">${esc(multi ? g.base : main.name)}</div><div class="su-item-meta">${esc(meta)}</div></div>
      <div class="su-item-actions">${buttons}</div>
    </div></li>`;
  }

  function listHtml(view) {
    const q = state.filter.trim().toLowerCase();
    const hit = (name) => !q || name.toLowerCase().includes(q);
    const folders = view.folders.filter((o) => hit(o.name));
    const groups = view.groups.filter((g) => g.files.some((f) => hit(f.name)));
    if (!folders.length && !groups.length) {
      if (q) return `<div class="su-empty">${icon('search')}<p>没有找到包含「${esc(state.filter.trim())}」的文件</p></div>`;
      return view.notes.length ? '' : `<div class="su-empty">${icon('folder')}<p>这个文件夹是空的</p></div>`;
    }
    return `<ul class="su-list">${folders.map(folderHtml).join('')}${groups.map(groupHtml).join('')}</ul>`;
  }

  function crumbsHtml(count) {
    const parts = state.path.split('/').filter(Boolean);
    const countHtml = count ? `<span class="su-count">${count} 项</span>` : '';
    if (!parts.length) return `<nav class="su-crumbs" aria-label="当前位置"><span aria-current="page">全部文件</span>${countHtml}</nav>`;
    let acc = '';
    const links = [`<a href="${esc(dirUrl('/'))}" data-nav="/">全部文件</a>`];
    parts.forEach((name, i) => {
      acc += `/${name}`;
      links.push(i === parts.length - 1
        ? `<span aria-current="page">${esc(name)}</span>`
        : `<a href="${esc(dirUrl(acc))}" data-nav="${esc(acc)}">${esc(name)}</a>`);
    });
    return `<nav class="su-crumbs" aria-label="当前位置">${links.join(icon('chevron'))}${countHtml}</nav>`;
  }

  function renderDir() {
    const info = state.info;
    const view = classify(state.objects);
    const files = state.objects.filter((o) => o.type !== 'dir');
    const ready = !state.loading && !state.error;

    const chips = [];
    if (ready && files.length) {
      chips.push(chip('files', `${files.length} 个文件 · ${fmtSize(files.reduce((s, o) => s + (o.size || 0), 0))}`));
    }
    chips.push(chip('download', `已下载 ${fmtNum(info.downloads)} 次`));
    const latest = ready ? Math.max(0, ...files.map((o) => Date.parse(o.date) || 0)) : 0;
    if (latest && fmtDate(latest)) chips.push(chip('clock', `更新于 ${fmtDate(latest)}`));
    if (info.expire > 0) chips.push(chip('clock', `${Math.max(1, Math.ceil(info.expire / 86400))} 天后失效`));

    const tools = [];
    if (ready && view.folders.length + view.groups.length > FILTER_MIN) {
      tools.push(`<label class="su-search">${icon('search')}<input type="search" class="su-filter" placeholder="筛选文件" value="${esc(state.filter)}" aria-label="筛选文件"></label>`);
    }
    const group = state.config && state.config.user && state.config.user.group;
    if (ready && group && group.allowArchiveDownload && state.objects.length) {
      tools.push(`<button type="button" class="su-btn su-btn-sm su-btn-soft" data-archive>${icon('archive')}<span>打包下载</span></button>`);
    }

    let content;
    if (state.loading) {
      content = `<div class="su-list">${skeletonRows(3)}</div>`;
    } else if (state.error) {
      content = `<div class="su-empty">${icon('alert')}<p>${esc(state.error.message)}</p>
        ${state.path === '/' ? '<button type="button" class="su-btn su-btn-primary" data-reload>重新加载</button>'
        : `<a class="su-btn su-btn-soft" href="${esc(dirUrl('/'))}" data-nav="/">返回全部文件</a>`}</div>`;
    } else {
      const hasAlt = view.groups.some((g) => g.files.length > 1 && g.files[0].kind.rank === 0
        && g.files.some((f) => f.kind.key === 'archive'));
      content = (view.notes.length ? `<div class="su-notes">${view.notes.map((f) => noteHtml(f, '使用说明')).join('')}</div>` : '')
        + (hasAlt ? `<div class="su-tip">${icon('info')}<span>同一软件提供安装程序和压缩包两种格式。若浏览器拦截 .exe 下载或提示有风险，可改为下载压缩包，解压后运行。</span></div>` : '')
        + `<div class="su-list-wrap">${listHtml(view)}</div>`;
    }

    render({
      heroIcon: icon('folder'),
      title: esc((info.source && info.source.name) || '分享'),
      meta: chips.join(''),
      body: `<section class="su-card">
        <div class="su-card-head">${crumbsHtml(ready ? state.objects.length : 0)}${tools.length ? `<div class="su-tools">${tools.join('')}</div>` : ''}</div>
        ${content}
      </section>`,
    });
    state.view = view;
  }

  async function loadDir(path, push) {
    const seq = ++state.seq;
    if (push) history.pushState(null, '', dirUrl(path));
    state.path = path;
    state.loading = true;
    state.error = null;
    state.filter = '';
    renderDir();
    try {
      const data = await api('GET', `/share/list/${encodeURIComponent(KEY)}${encodeURIComponent(path)}`);
      if (seq !== state.seq) return;
      state.objects = (data && data.objects) || [];
    } catch (e) {
      if (seq !== state.seq) return;
      state.objects = [];
      state.error = e;
    }
    state.loading = false;
    renderDir();
  }

  async function archiveAll(btn) {
    const items = [];
    const dirs = [];
    state.objects.forEach((o) => (o.type === 'dir' ? dirs : items).push(o.id));
    setBusy(btn, '正在打包…');
    try {
      const url = await api('POST', `/share/archive/${encodeURIComponent(KEY)}`, { items, dirs, path: state.path });
      triggerDownload(url);
      toast('打包完成，已开始下载');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      restore(btn);
    }
  }

  // ---------- 单文件分享 ----------

  function renderFile() {
    const info = state.info;
    const f = describe({
      id: '__share__', name: (info.source && info.source.name) || '文件', size: (info.source && info.source.size) || 0, path: '/', type: 'file',
    });
    state.files.clear();
    state.files.set(f.id, f);

    const preview = info.preview && f.kind.key === 'image'
      ? `<div class="su-preview"><img src="${API}/share/preview/${encodeURIComponent(KEY)}" alt="${esc(f.name)}"></div>` : '';
    const viewer = (f.kind.key === 'text' || f.kind.key === 'config') && f.size <= NOTE_MAX
      ? `<div class="su-notes">${noteHtml(f, '文件内容')}</div>` : '';

    const chips = [chip('download', `已下载 ${fmtNum(info.downloads)} 次`)];
    if (fmtDate(info.create_date)) chips.push(chip('clock', `分享于 ${fmtDate(info.create_date)}`));
    if (info.expire > 0) chips.push(chip('clock', `${Math.max(1, Math.ceil(info.expire / 86400))} 天后失效`));

    render({
      heroIcon: icon('file'),
      title: esc(f.name),
      meta: chips.join(''),
      body: `<section class="su-card su-single">
        ${preview || badge(f, 'su-badge-lg')}
        <div class="su-single-meta">${esc(f.kind.label)} · ${fmtSize(f.size)}</div>
        <button type="button" class="su-btn su-btn-primary su-btn-lg su-btn-block" data-dl="${f.id}">${icon('download')}<span>下载文件</span><span class="su-btn-size">${fmtSize(f.size)}</span></button>
        <div class="su-retry-host"></div>
        ${viewer}
      </section>`,
    });
  }

  // ---------- 下载与查看 ----------

  const original = new WeakMap();

  function setBusy(btn, text) {
    if (!original.has(btn)) original.set(btn, btn.innerHTML);
    btn.disabled = true;
    btn.classList.remove('is-done');
    btn.innerHTML = `<span class="su-spin"></span><span>${esc(text)}</span>`;
  }

  function restore(btn) {
    if (original.has(btn)) btn.innerHTML = original.get(btn);
    btn.disabled = false;
    btn.classList.remove('is-done');
  }

  function retryHost(btn) {
    const box = btn.closest('.su-note-body, .su-single, li');
    if (!box) return null;
    return box.querySelector('.su-retry-host, .su-note-foot, .su-item-body');
  }

  async function startDownload(btn, f) {
    if (!f || btn.disabled) return;
    setBusy(btn, '准备中…');
    try {
      const q = state.info.is_dir ? `?path=${encodeURIComponent(fullPath(f))}` : '';
      const url = await api('PUT', `/share/download/${encodeURIComponent(KEY)}${q}`);
      triggerDownload(url);
      btn.disabled = false;
      btn.classList.add('is-done');
      btn.innerHTML = `${icon('check')}<span>已开始下载</span>`;
      setTimeout(() => { if (btn.isConnected) restore(btn); }, 4000);
      toast('已开始下载，请在浏览器的下载列表中查看');
      const host = retryHost(btn);
      if (host) {
        const old = host.querySelector('.su-retry');
        if (old) old.remove();
        host.insertAdjacentHTML('beforeend',
          `<div class="su-retry">${icon('check')}<span>${esc(f.name)} 下载已开始。没有反应？</span><a href="${esc(url)}">点此重新下载</a></div>`);
      }
    } catch (e) {
      restore(btn);
      toast(e.message, 'error');
      if (e.code === 401) {
        setTimeout(() => {
          location.href = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
        }, 1200);
      }
    }
  }

  async function fetchText(f) {
    const q = state.info.is_dir ? `?path=${encodeURIComponent(fullPath(f))}` : '';
    let res;
    try {
      res = await fetch(`${API}/share/content/${encodeURIComponent(KEY)}${q}`, { credentials: 'same-origin' });
    } catch (e) {
      throw new ApiError(-1, '网络连接失败，请检查网络后重试');
    }
    const text = decodeText(await res.arrayBuffer());
    // 出错时接口返回 {code,msg} JSON；正常时直接是文件内容
    if ((res.headers.get('content-type') || '').includes('application/json')) {
      let j = null;
      try { j = JSON.parse(text); } catch (e) { j = null; }
      if (j && typeof j.code === 'number' && 'msg' in j && j.code !== 0) throw apiError(j.code, j.msg);
    }
    if (!res.ok) throw new ApiError(res.status, `读取失败（HTTP ${res.status}）`);
    return text;
  }

  async function toggleNote(btn, f) {
    const box = btn.closest('.su-note');
    if (box.classList.contains('is-open')) {
      box.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      return;
    }
    const textEl = box.querySelector('.su-note-text');
    if (!textEl.dataset.loaded) {
      setBusy(btn, '读取中…');
      try {
        const text = (await fetchText(f)).trim();
        textEl.innerHTML = text ? linkify(esc(text)) : '（空文件）';
        textEl.dataset.loaded = '1';
      } catch (e) {
        toast(e.message, 'error');
        return;
      } finally {
        restore(btn);
      }
    }
    box.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }

  // ---------- 入口 ----------

  function openShare() {
    const info = state.info;
    document.title = `${(info.source && info.source.name) || '分享'} - ${siteTitle()}`;
    if (info.is_dir) loadDir(state.path, false);
    else renderFile();
  }

  root.addEventListener('click', (e) => {
    const t = e.target;
    const nav = t.closest('[data-nav]');
    if (nav) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      loadDir(nav.getAttribute('data-nav'), true);
      return;
    }
    const dl = t.closest('[data-dl]');
    if (dl) {
      startDownload(dl, state.files.get(dl.getAttribute('data-dl')));
      return;
    }
    const note = t.closest('[data-note]');
    if (note) {
      if (!note.disabled) toggleNote(note, state.files.get(note.getAttribute('data-note')));
      return;
    }
    const arc = t.closest('[data-archive]');
    if (arc) {
      if (!arc.disabled) archiveAll(arc);
      return;
    }
    if (t.closest('[data-reload]')) {
      location.reload();
      return;
    }
    if (t.closest('[data-copy-link]')) {
      copyText(location.href).then((ok) => toast(ok ? '链接已复制，请粘贴到浏览器中打开' : '复制失败，请手动复制地址栏中的链接', ok ? 'info' : 'error'));
    }
  });

  root.addEventListener('submit', (e) => {
    if (e.target.matches('.su-lock-form')) {
      e.preventDefault();
      unlock(e.target);
    }
  });

  root.addEventListener('input', (e) => {
    if (e.target.matches('.su-filter') && state.view) {
      state.filter = e.target.value;
      const wrap = root.querySelector('.su-list-wrap');
      if (wrap) wrap.innerHTML = listHtml(state.view);
    }
  });

  window.addEventListener('popstate', () => {
    if (state.info && state.info.is_dir && !state.info.locked) {
      loadDir(normalizePath(new URLSearchParams(location.search).get('path')), false);
    }
  });

  async function start() {
    document.documentElement.lang = 'zh-CN';
    document.body.classList.add('su-page');
    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', '#3341cc');
    renderLoading();

    const params = new URLSearchParams(location.search);
    state.path = normalizePath(params.get('path'));
    const pwd = params.get('password') || '';
    // 串行请求：Cloudreve 用 Cookie 存会话，site/config（写入 CSRF 标记）与 share/info（写入解锁状态）
    // 并发时后返回的 Set-Cookie 会覆盖前一个
    try {
      state.config = await api('GET', '/site/config');
    } catch (e) {
      state.config = null;
    }

    let info;
    try {
      info = await api('GET', `/share/info/${encodeURIComponent(KEY)}${pwd ? `?password=${encodeURIComponent(pwd)}` : ''}`);
    } catch (e) {
      renderError(e);
      return;
    }
    state.info = info;
    if (info.locked) renderLocked(pwd ? '提取码不正确，请重新输入' : '');
    else openShare();
  }

  start().catch((err) => {
    console.error(err);
    root.innerHTML = `<div class="su-fatal">页面加载出错。<a href="${esc(CLASSIC_URL)}">切换到经典界面</a></div>`;
  });
})();
