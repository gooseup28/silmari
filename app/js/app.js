/* 실마리 화면 — 해시 주소로 화면을 나눠요 (15번 기획서 16장). 규칙은 price/routes/planner/draft/store 파일에 있어요. */
(function (S) {
  'use strict';
  const P = S.price, RT = S.routes, PL = S.planner, D = S.draft, ST = S.store, U = S.util, C = S.config, J = U.josa;

  // ---------- 오늘 (시험용 ?today=YYYY-MM-DD) ----------
  const qToday = new URLSearchParams(location.search).get('today');
  const TODAY = /^\d{4}-\d{2}-\d{2}$/.test(qToday || '') ? qToday : U.todayISO();

  // ---------- 상태 ----------
  let data = ST.load();
  let demo = null;                         // 예시 정리 (저장하지 않아요)
  let addDraft = null;                     // 물건 추가 중 (아직 저장 전)
  let view = { pref: null, showAll: false, why: false, addingMarket: false, editDraft: false, soldOpen: false };
  const proj = () => demo || data.projects.find(p => !p.finishedAt) || null;
  // 밝기: 기기 설정 / 밝게 / 어둡게
  function applyTheme() {
    const t = (data.settings && data.settings.theme) || 'system';
    if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#0F1311' : '#F4F5F3';
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  const itemById = id => (proj() ? proj().items.find(i => i.id === id) : null);
  function persist() { if (!demo) ST.save(data); }
  function replan() { const p = proj(); if (p) p.tasks = PL.plan(p, TODAY); }
  const snapshot = () => JSON.stringify(demo || data);
  function restore(snap) { const d = JSON.parse(snap); if (demo) demo = d; else data = d; persist(); render(); }

  // ---------- 작은 도구 ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const go = h => { if (location.hash === h) render(); else location.hash = h; };

  const IC = {
    back: '<path d="M14.5 6l-6 6 6 6"/>', chev: '<path d="M9.5 6l6 6-6 6"/>', down: '<path d="M6 9.5l6 6 6-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M7 7l10 10M17 7L7 17"/>',
    set: '<path d="M4 7h9"/><path d="M18 7h2"/><circle cx="15.5" cy="7" r="2.2"/><path d="M4 17h3"/><path d="M12 17h8"/><circle cx="9.5" cy="17" r="2.2"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
    home: '<path d="M4 10.5L12 4l8 6.5V20h-5.5v-5.5h-5V20H4z"/>',
    rec: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.2"/><path d="M15.5 8.5V5.2a1.2 1.2 0 0 0-1.2-1.2H5.2A1.2 1.2 0 0 0 4 5.2v9.1a1.2 1.2 0 0 0 1.2 1.2h3.3"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/>',
    sell: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7z"/><circle cx="8" cy="8" r="1.4"/>',
    buyback: '<path d="M13 3L5.5 13.5h5.5L10 21l8.5-11h-5.8z"/>',
    consign: '<path d="M5 8.5h14l-1.2 11.5H6.2z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
    pickup: '<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 9.5h4l3 3.5v3.5h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    give: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
    dispose: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/>',
    keep: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5"/><path d="M12 12v9"/>',
    none: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.4"/><circle cx="12" cy="16.9" r=".6"/>',
    move: '<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 9.5h4l3 3.5v3.5h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    discharge: '<path d="M5 21V4"/><path d="M5 4.5h11.5l-2.2 4 2.2 4H5"/>',
    graduate: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.8v4.4c3.2 2.1 7.8 2.1 11 0v-4.4"/>',
    marry: '<path d="M3.5 11L12 4l8.5 7v9h-17z"/><path d="M12 17.2s-2.8-1.7-2.8-3.5a1.4 1.4 0 0 1 2.8-.6 1.4 1.4 0 0 1 2.8.6c0 1.8-2.8 3.5-2.8 3.5z"/>',
    just: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5"/><path d="M12 12v9"/>'
  };
  const icon = (n, color, size, w) => `<svg width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="${color || 'currentColor'}" stroke-width="${w || 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
  // 실마리 로고: 실타래 (가닥이 아래로 갈수록 굵어지고, 끝 한 가닥이 풀려 나와요)
  const LOGO = '<svg class="logo" width="32" height="32" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="slg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3EE08A"/><stop offset="1" stop-color="#14A44D"/></linearGradient><clipPath id="slc"><circle cx="32" cy="32" r="16"/></clipPath></defs><rect width="64" height="64" rx="16" fill="url(#slg)"/><path d="M41 42.5c2.8 2.4 5.6 3.6 9 3.8" fill="none" stroke="#fff" stroke-width="5.4" stroke-linecap="round"/><circle cx="32" cy="32" r="16" fill="#fff"/><g clip-path="url(#slc)" fill="none" stroke="#14A44D" stroke-linecap="round"><path d="M18 24.5Q32 16.5 46 22.5" stroke-width="2.6"/><path d="M16.5 32.5Q33 22.5 48 30.5" stroke-width="3.8"/><path d="M17 41Q35 29.5 49.5 39" stroke-width="5.2"/></g></svg>';
  const RCOL = { sell: ['var(--sell-bg)', 'var(--sell-ic)'], buyback: ['var(--buy-bg)', 'var(--buy-ic)'], consign: ['var(--con-bg)', 'var(--con-ic)'],
    pickup: ['var(--con-bg)', 'var(--con-ic)'], give: ['var(--give-bg)', 'var(--give-ic)'], dispose: ['var(--dis-bg)', 'var(--dis-ic)'],
    keep: ['var(--dis-bg)', 'var(--dis-ic)'], none: ['var(--dis-bg)', 'var(--icon-muted)'] };
  const ricon = (r, cls) => { const k = r || 'none'; return `<span class="ic ${cls || ''}" data-bg="${RCOL[k][0]}">${icon(k, RCOL[k][1], cls ? 20 : 22, 1.9)}</span>`; };
  const rlabel = r => (r ? RT.ROUTES[r].label : '길 정하기 전');

  // ---------- 연결 서비스 (공식 주소 확인: 2026-11-06. 주소에 물건 정보를 싣지 않아요) ----------
  const SERVICES = {
    buyback: [
      { name: '번개장터 · 번개견적', url: 'https://m.bunjang.co.kr/', only: ['smartphone', 'tablet', 'laptop'],
        desc: '사진과 상태를 올리면 매입 업체들이 견적을 내요. 견적은 72시간 안에 와요. 스마트폰·노트북·태블릿 등을 받아요.', src: '품목·시간은 번개장터 발표(2026-08) 기준이에요.' },
      { name: '민팃', url: 'https://www.mintit.co.kr/', only: ['smartphone'],
        desc: '중고폰 ATM이 기능과 외관을 진단하고 매입가를 알려 줘요. 5분 안팎 걸려요.' }
    ],
    consign: [{ name: '차란', url: 'https://apps.apple.com/kr/app/id1667756218',
      desc: '가방을 신청해 옷을 담아 내놓으면 촬영·세탁·판매를 대신 해 줘요. 팔리면 정산돼요.', src: '앱스토어 페이지로 열려요.' }],
    pickup: [{ name: '리클', url: 'https://www.recl.co.kr/', desc: '앱으로 신청하면 문 앞에서 헌옷을 수거해 가요. 20벌부터 받아요.' }],
    dispose: [{ name: '빼기', url: 'https://bbegi.com/', desc: '대형 폐기물 배출 신청을 앱으로 할 수 있어요.' }]
  };

  // ---------- 할 일 이름 ----------
  function priceOf(it) { return P.calc(it); }
  function taskText(t, it) {
    const p = proj(), nm = it ? it.name : '';
    switch (t.kind) {
      case 'post_sale': return P.canPrice(it) ? `${nm} 판매글 올리기` : `${nm} 가격 알아보고 판매글 올리기`;
      case 'drop_price': {
        const c = priceOf(it); const cur = it.finalPrice || (c && c.start);
        return c && cur ? `안 팔렸으면 ${nm} ${J.ro(P.won(P.dropSuggestion(cur, c.low, it.marketPrices)))}` : `안 팔렸으면 ${nm} 가격 내리기`;
      }
      case 'switch_route': return `안 팔렸으면 ${nm} ${RT.isBuybackable(it) ? '매입이나 나눔으로' : '나눔으로'} 바꾸기`;
      case 'apply_buyback': return `${nm} 매입 견적 신청`;
      case 'send_buyback': return `${nm} 매입 업체로 보내기`;
      case 'apply_consign': return `${nm} 맡기기 신청`;
      case 'apply_pickup': return `${nm} 수거 신청`;
      case 'post_give': return `${nm} 나눔 글 올리기`;
      case 'apply_dispose': return it && it.category === 'furniture' ? `${nm} 대형 폐기물 신청` : `${nm} 버리기 신청`;
      case 'deadline': return ST.reasonOf(p.reason).day;
    }
    return '';
  }
  function taskHint(t, it) {
    const c = it && priceOf(it);
    return {
      post_sale: '직접 팔기 · ' + (c ? `추천 ${P.won(c.low).replace('원', '')} ~ ${P.won(c.high)}` : '살 때 가격부터 적어요'),
      drop_price: '가격 내리기 · 안 팔렸을 때만', switch_route: '길 바꾸기 · 안 팔렸을 때만',
      apply_buyback: '바로 매입 · 사진과 상태만 보내면 돼요', send_buyback: '바로 매입 · 견적 받은 곳으로 보내요',
      apply_consign: '맡기기 · 담아서 내놓으면 돼요', apply_pickup: '수거 · 문 앞에 내놓으면 돼요',
      post_give: '나눔 · 글은 실마리가 써 둬요', apply_dispose: '버리기 · 구청이나 수거 앱에 신청해요'
    }[t.kind] || '';
  }
  function taskChip(t, it) {
    if (t.kind === 'drop_price') return '<span class="chip c-warn">가격 내리기</span>';
    if (t.kind === 'switch_route') return '<span class="chip c-give">길 바꾸기</span>';
    const r = it ? it.route : null;
    return r ? `<span class="chip c-${r}">${rlabel(r)}</span>` : '';
  }

  // ---------- 되돌리기 알림 ----------
  let toastTimer = null;
  function toast(msg, snap) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>` + (snap ? '<button type="button" id="undo">되돌리기</button>' : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
    if (snap) $('#undo').onclick = () => { el.hidden = true; restore(snap); };
  }
  function change(fn, msg) {
    const snap = snapshot();
    fn();
    replan(); persist();
    if (msg) toast(msg, snap);
    render();
  }

  // 할 일을 끝내면 물건 상태도 바꿔요
  function completeTask(t) {
    const it = itemById(t.itemId);
    t.done = true; t.doneAt = TODAY;
    if (!it) return;
    if (t.kind === 'post_sale') { it.state = 'doing'; it.listedAt = it.listedAt || TODAY; }
    if (t.kind === 'apply_buyback' || t.kind === 'post_give') it.state = 'doing';
    if (['apply_consign', 'apply_pickup', 'apply_dispose'].includes(t.kind)) { it.state = 'done'; it.doneAt = TODAY; }
  }
  function markStart(it, kind) {
    const p = proj();
    let t = p.tasks.find(x => x.itemId === it.id && x.kind === kind);
    if (!t) { t = { id: it.id + ':' + kind, itemId: it.id, kind, date: TODAY, done: false, doneAt: null, userEdited: false }; p.tasks.push(t); }
    completeTask(t);
  }

  // ---------- 공통 조각 ----------
  const flowbar = (title, backHref, meta) => `<div class="flowbar"><a class="iconbtn" href="${backHref}" aria-label="뒤로">${icon('back', 'var(--ink)', 24, 2)}</a><span class="t">${esc(title)}</span><span class="m">${esc(meta || '')}</span></div>`;
  function tabbar() { return ''; }   // 탭 바는 index.html의 #tabdock 하나를 계속 써요 (setDock)
  function oldTabbar(cur) {
    const t = (h, n, l) => `<a href="${h}"${cur === h ? ' aria-current="page"' : ''}>${icon(n, cur === h ? 'var(--accent-ink)' : 'var(--ink-3)', 22, cur === h ? 2 : 1.8)}${l}</a>`;
    return `<div class="tabdock"><nav class="tabbar" aria-label="주요 메뉴">${t('#/home', 'home', '정리')}${t('#/plan', 'cal', '계획')}${t('#/records', 'rec', '기록')}</nav></div>`;
  }
  const PREVIEW = new URLSearchParams(location.search).get('preview') === '1';   // 허브용 화면 사진 찍을 때만
  if (PREVIEW) document.documentElement.classList.add('preview');
  const demoBand = () => (demo && !PREVIEW ? '<div class="demo-band" role="status"><span>예시 정리예요. 눌러 봐도 저장되지 않아요.</span><button type="button" data-act="exit-demo">나가기</button></div>' : '');
  const pressed = b => ` aria-pressed="${b ? 'true' : 'false'}"`;
  const radioMark = () => `<span class="radio">${icon('check', 'var(--on-accent)', 14, 3)}</span>`;   // 체크는 늘 있고, 고르면 부드럽게 나타나요
  const segThumb = '<i class="seg-thumb" aria-hidden="true"></i>';
  function daysLeft(p) { return p && p.deadline ? U.diffDays(TODAY, p.deadline) : null; }
  function untilLine(p) { return p.deadline ? `${U.fmtMD(p.deadline)} ${ST.reasonOf(p.reason).until}` : '마감 없이 정리해요'; }

  // ======================================================================
  // S1 정리 시작
  // ======================================================================
  let startForm = { reason: 'move', deadline: U.addDays(TODAY, 27), noDate: false };
  function vStart() {
    const f = startForm, dl = f.noDate ? null : f.deadline;
    const opts = ST.REASONS.map(r => `<button type="button" class="choice" data-reason="${r.key}"${pressed(f.reason === r.key)}>${icon(r.key, 'currentColor')}<span class="grow">${r.label}</span>${radioMark()}</button>`).join('');
    const dn = dl ? U.diffDays(TODAY, dl) : null;
    return { cls: 'flow', html: `
      <div class="pad grow" data-pt="48">
        <div class="brand">${LOGO}<b>실마리</b></div>
        <p class="eyebrow">팔고 싶지만 어디서부터 시작할지 모를 때</p>
        <h1 class="big">어떤 정리를<br>앞두고 있어요?</h1>
        <div class="choices" data-mt="24">${opts}</div>
        <p class="label">언제까지 정리해야 해요?</p>
        ${f.noDate ? '' : `<label class="datebtn">${icon('cal', 'var(--ink-2)', 20)}<span class="grow">${U.fmtMD(f.deadline).replace(/^(\d+)월/, (m) => m)}</span><span class="chipD">${dn === 0 ? '오늘' : 'D-' + dn}</span>
          <input type="date" id="deadline" min="${TODAY}" value="${f.deadline}" aria-label="정리 마감 날짜"></label>`}
        ${f.reason === 'just' ? `<label class="check"><input type="checkbox" id="nodate"${f.noDate ? ' checked' : ''}> 날짜는 정하지 않을래요 (계획 없이 길만 정해요)</label>` : ''}
      </div>
      <div class="bottom">
        <p class="note">${icon('lock', 'var(--ink-3)', 16)}<span>가입 없이 시작해요. 정리 목록은 이 기기에만 저장돼요.</span></p>
        <button type="button" class="btn" data-act="start">정리 시작하기</button>
        <button type="button" class="textbtn center gray" data-act="demo">예시 정리 보기</button>
      </div>`,
      after() {
        $$('[data-reason]').forEach(b => b.onclick = () => { startForm.reason = b.dataset.reason; if (startForm.reason !== 'just') startForm.noDate = false; render(true); });
        const d = $('#deadline'); if (d) d.onchange = () => { if (d.value && d.value >= TODAY) { startForm.deadline = d.value; render(true); } };
        const nd = $('#nodate'); if (nd) nd.onchange = () => { startForm.noDate = nd.checked; render(true); };
      }
    };
  }
  function doStart() {
    demo = null;                                                // 예시를 보다 시작해도 진짜 정리로
    const p = ST.newProject(startForm.reason, startForm.noDate ? null : startForm.deadline);
    data.projects = data.projects.filter(x => x.finishedAt);   // 정리는 하나만 (여러 개는 P2)
    data.projects.unshift(p);
    replan(); persist(); go('#/home');
  }

  // ======================================================================
  // H1 홈
  // ======================================================================
  function vHome() {
    const p = proj(); if (!p) return null;
    const pr = PL.progress(p), dl = daysLeft(p);
    const due = p.tasks.filter(t => !t.done && t.kind !== 'deadline' && t.date <= TODAY);
    const next = p.tasks.find(t => !t.done && t.kind !== 'deadline' && t.date > TODAY);
    const remain = pr.total - pr.finished;
    let top = '';
    if (!ST.available && !demo) top += '<p class="band gray">이 브라우저에서는 저장이 안 돼요. 창을 닫으면 사라져요.</p>';
    if (dl != null && dl < 0) top += `<p class="band warn">마감이 지났어요.<button type="button" class="textbtn" data-act="go-settings">날짜 바꾸기</button><button type="button" class="textbtn" data-act="finish">정리 끝내기</button></p>`;
    else if (dl != null && dl < C.SHORT_DAYS) top += `<p class="band warn">마감까지 ${dl}일 — 덜 귀찮은 길 위주로 계획을 줄였어요</p>`;

    const dayBlock = p.deadline
      ? `<p class="sub" data-mt="10">${esc(untilLine(p))}</p><div class="dday">${dl > 0 ? `<b>${dl}일</b><span>남았어요</span>` : dl === 0 ? '<b>오늘</b><span>이에요</span>' : `<b>${-dl}일</b><span>지났어요</span>`}</div>`
      : `<p class="sub" data-mt="10">마감 없이 정리해요</p><div class="dday"><b>${pr.total}개</b><span>정리할 물건</span></div>`;
    const progressLine = `<div class="bar"><i data-w="${pr.total ? (pr.finished / pr.total) * 100 : 0}"></i></div>
      <div class="barline"><span>${pr.total && remain > 0 && remain <= 2 ? `${remain}개만 더 하면 끝나요` : `${pr.total}개 중 ${pr.finished}개 정리했어요`}</span><span>길을 정한 물건 ${pr.routed}개</span></div>`;

    let body;
    if (!pr.total) {
      const hint = { move: '서랍 속 안 쓰는 충전기나 이어폰부터', discharge: '부대 사물함 속 물건부터', graduate: '책장 끝 교재부터' }[p.reason] || '눈에 보이는 작은 물건부터';
      body = `<div class="card" data-mt="18"><h2 class="card-t">집에서 정리할 물건 하나만 떠올려 볼까요?</h2><p class="small" data-mt="6">${hint} 시작해 보세요.</p>
        <a class="btn h52" data-mt="14" href="#/add">${icon('plus', 'var(--on-accent)', 20, 2)}물건 추가</a></div>`;
    } else {
      const rows = due.map(t => taskRow(t)).join('');
      body = `<section class="card" aria-label="오늘 할 일" data-mt="18" data-pb="4">
          <div class="brand" data-gap="8"><h2 class="card-t">오늘 할 일</h2>${due.length ? `<span class="chip round c-sell">${due.length}</span>` : ''}</div>
          ${rows || '<p class="small" data-mt="8" data-mb="8">오늘 할 일은 다 했어요.</p>'}
          ${next ? `<p class="nextline">${icon('cal', 'var(--ink-3)', 16)}<span>다음 · ${U.fmtMD(next.date)} ${esc(taskText(next, itemById(next.itemId)))}</span></p>` : ''}
        </section>`;
      if (pr.unrouted.length) {
        const u = pr.unrouted[0];
        body += `<a class="card rowlink" data-mt="10" href="#/item/${u.id}/route">${ricon(null)}<span class="grow"><span class="t1">${esc(u.name)}${pr.unrouted.length > 1 ? ` 외 ${pr.unrouted.length - 1}개` : ''}</span><span class="t2">길을 정해 주세요</span></span>${icon('chev', 'var(--icon-muted)', 18, 2)}</a>`;
      }
      const list = p.items.slice().sort((a, b) => a.order - b.order);
      body += `<div class="secrow"><h2 class="card-t">물건 ${list.length}개</h2>${list.length > 3 ? '<a href="#/items">모두 보기</a>' : ''}</div>
        <div class="card list">${list.slice(0, 3).map(itemRow).join('')}</div>`;
    }
    return { cls: 'tab', html: `${demoBand()}
      <div class="scroll"><div class="tabpad" data-pb="12">
        <div class="tabhead"><span class="name">${esc(p.title)}</span><a class="iconbtn" href="#/settings" aria-label="설정">${icon('set', 'var(--ink)')}</a></div>
        ${dayBlock}${progressLine}${top}${body}
      </div></div>
      ${tabbar('#/home')}` };   // 물건 추가는 탭 바 옆 둥근 + 버튼으로 옮겼어요
  }
  function taskRow(t) {
    const it = itemById(t.itemId);
    return `<div class="task"><button type="button" class="circle" data-done="${t.id}" aria-label="${esc(taskText(t, it))} 완료로 표시"><i></i></button>
      <a class="rowlink" href="#/item/${t.itemId}"><span class="grow"><span class="t1">${esc(taskText(t, it))}</span><span class="t2">${esc(taskHint(t, it))}</span></span>${icon('chev', 'var(--icon-muted)', 18, 2)}</a></div>`;
  }
  function itemState(it) {
    const p = proj();
    if (!it.route) return '길 정하기 전';
    if (it.state === 'kept') return '계속 쓰기';
    if (it.state === 'done') return { sell: '팔았어요', buyback: '팔았어요', give: '전달했어요' }[it.route] || '신청 완료';
    if (it.route === 'sell') {
      if (it.state === 'doing') return `${P.won(it.finalPrice || 0)}에 올렸어요`;
      return it.finalPrice ? `${P.won(it.finalPrice)}에 올릴 예정` : '가격 알아보기 전';
    }
    if (it.state === 'doing') return { buyback: it.quoteAt ? '견적 받음' : '견적 기다리는 중', give: '나눔 글 올림' }[it.route] || '진행 중';
    const t = p.tasks.find(x => x.itemId === it.id && !x.done && x.kind !== 'drop_price' && x.kind !== 'switch_route');
    return t ? `${U.fmtShort(t.date)} ${{ apply_buyback: '견적 신청', apply_consign: '신청', apply_pickup: '신청', post_give: '나눔 글', apply_dispose: '신청' }[t.kind] || ''}` : '';
  }
  function itemRow(it) {
    const p = proj();
    const t = p.tasks.find(x => x.itemId === it.id && !x.done);
    const tag = PL.isFinished(it) ? '<span class="chip c-none">끝</span>' : t ? (t.date <= TODAY ? '<span class="chip c-sell">오늘</span>' : `<span class="chip c-none">${U.fmtShort(t.date)}</span>`) : '';
    return `<a class="item" href="#/item/${it.id}">${ricon(it.route)}<span class="grow"><span class="t1" data-block="1">${esc(it.name)}</span><span class="small" data-block="1">${esc(rlabel(it.route))} · ${esc(itemState(it))}</span></span>${tag}</a>`;
  }

  // 물건 모두 보기
  function vItems() {
    const p = proj(); if (!p) return null;
    const list = p.items.slice().sort((a, b) => a.order - b.order);
    return { cls: 'flow', html: `${flowbar('물건 ' + list.length + '개', '#/home')}
      <div class="pad">${list.map(it => `<div class="task">${itemRow(it).replace('class="item"', 'class="item grow"')}<button type="button" class="iconbtn" data-del="${it.id}" aria-label="${esc(it.name)} 지우기">${icon('trash', 'var(--ink-3)', 20)}</button></div>`).join('') || '<p class="small">아직 물건이 없어요.</p>'}</div>` };
  }

  // ======================================================================
  // H2 계획
  // ======================================================================
  function vPlan() {
    const p = proj(); if (!p) return null;
    const left = p.tasks.filter(t => !t.done && t.kind !== 'deadline').length;
    let body;
    if (!p.deadline) body = '<div class="card" data-mt="16"><p class="small">마감 날짜가 없어서 계획을 짜지 않았어요. 설정에서 날짜를 넣으면 거꾸로 계획을 짜 드려요.</p></div>';
    else {
      const groups = [];
      p.tasks.forEach(t => { const g = groups[groups.length - 1]; if (g && g.date === t.date) g.tasks.push(t); else groups.push({ date: t.date, tasks: [t] }); });
      body = `<section class="card" aria-label="날짜별 할 일" data-mt="16" data-pt="18">${groups.map((g, gi) => {
        const isDl = g.tasks.some(t => t.kind === 'deadline');
        const allDone = g.tasks.every(t => t.done);
        const isToday = g.date === TODAY;
        const warn = g.tasks.some(t => t.kind === 'drop_price' && !t.done);
        const dn = U.diffDays(g.date, p.deadline);
        const dot = isDl ? `<span class="dot home">${icon('home', 'var(--surface)', 12, 2.6)}</span>` : allDone ? `<span class="dot done">${icon('check', 'var(--surface)', 10, 3.4)}</span>` : isToday ? '<span class="dot today"></span>' : `<span class="dot${warn ? ' warn' : ''}"></span>`;
        const tag = isDl ? `<span class="small" data-strong="1">${esc(ST.reasonOf(p.reason).day)}</span>` : allDone ? '<span class="tiny">끝냄</span>' : isToday ? '<span class="chip round c-today">오늘</span>' : `<span class="${warn ? 'chip c-warn' : 'tiny'}">D-${dn}</span>`;
        const rows = g.tasks.filter(t => t.kind !== 'deadline').map(t => {
          const it = itemById(t.itemId);
          return `<div class="tk${t.done ? ' done' : ''}"><span class="grow">${esc(taskText(t, it))}</span>${taskChip(t, it)}${t.done ? '' : `<label class="when" aria-label="${esc(taskText(t, it))} 날짜 바꾸기">${icon('cal', 'var(--ink-3)', 16)}<input type="date" data-date="${t.id}" min="${TODAY}" max="${p.deadline}" value="${t.date}"></label>`}</div>`;
        }).join('');
        return `<div class="tl"><div class="rail">${dot}${gi < groups.length - 1 ? '<span class="ln"></span>' : ''}</div><div class="body"${gi === groups.length - 1 ? ' data-pb="0"' : ''}><div class="dh"><span${allDone && !isDl ? ' class="small"' : ''}>${U.fmtMD(g.date)}</span>${tag}</div>${rows}</div></div>`;
      }).join('')}</section>
      <p class="tiny" data-mt="12" data-mx="4">날짜는 실마리가 짠 기본 계획이에요. 달력 버튼으로 바꿀 수 있어요.</p>`;
    }
    return { cls: 'tab', html: `${demoBand()}<div class="scroll"><div class="tabpad" data-pb="16">
      <div class="tabhead"><h1>정리 계획</h1></div>
      <p class="sub" data-mt="6">${esc(untilLine(p))}${p.deadline ? ` · 남은 할 일 ${left}개` : ''}</p>${body}</div></div>${tabbar('#/plan')}` };
  }

  // H3 기록
  function vRecords() {
    const p = proj(); if (!p) return null;
    const done = p.items.filter(PL.isFinished);
    const money = done.reduce((a, i) => a + (i.doneAmount || 0), 0);
    const gave = done.filter(i => i.route === 'give').length;
    return { cls: 'tab', html: `${demoBand()}<div class="scroll"><div class="tabpad" data-pb="16">
      <div class="tabhead"><h1>기록</h1></div>
      <p class="sub" data-mt="6">${money ? `판 돈 ${P.won(money)} · ` : ''}나눔 ${gave}개 · 비운 물건 ${done.filter(i => i.state === 'done').length}개</p>
      <div class="card list" data-mt="16">${done.length ? done.map(it => `<div class="item">${ricon(it.route)}<span class="grow"><span class="t1" data-block="1">${esc(it.name)}</span><span class="small" data-block="1">${esc(rlabel(it.route))}${it.doneAt ? ' · ' + U.fmtMD(it.doneAt) : ''}${it.doneAmount ? ' · ' + P.won(it.doneAmount) : ''}</span></span></div>`).join('') : '<p class="small" data-my="14">아직 끝낸 물건이 없어요.</p>'}</div>
      </div></div>${tabbar('#/records')}` };
  }

  // H4 설정
  function vSettings() {
    const p = proj(); if (!p) return null;
    const dl = daysLeft(p), theme = data.settings.theme || 'system';
    const chev = icon('chev', 'var(--icon-muted)', 18, 2);
    return { cls: 'flow', html: `${flowbar('설정', '#/home')}<div class="pad" data-pb="40">
      ${demo ? '<p class="band info">예시 정리라서 바꿔도 저장되지 않아요.</p>' : ''}
      <h2 class="setlabel">이 정리</h2>
      <div class="setcard">
        <div class="setblock"><p class="setk">무슨 정리예요?</p>
          <div class="pills">${ST.REASONS.map(r => `<button type="button" class="pill" data-s-reason="${r.key}"${pressed(p.reason === r.key)}>${r.label}</button>`).join('')}</div></div>
        <div class="setblock"><p class="setk">마감 날짜</p>
          <label class="datebtn">${icon('cal', 'var(--ink-2)', 20)}<span class="grow">${p.deadline ? U.fmtMD(p.deadline) : '정하지 않음'}</span>${dl != null ? `<span class="chipD">${dl === 0 ? '오늘' : dl > 0 ? 'D-' + dl : dl * -1 + '일 지남'}</span>` : ''}
            <input type="date" id="s-deadline" min="${TODAY}" value="${p.deadline || ''}" aria-label="마감 날짜 바꾸기"></label>
          <p class="tiny" data-mt="8">날짜를 바꾸면 계획을 다시 짜요. 직접 바꾼 할 일 날짜는 그대로 둬요.</p></div>
        <div class="setblock"><p class="setk">길을 보여 줄 때</p>
          <div class="seg">${segThumb}<button type="button" data-pref="easy"${pressed(p.preference !== 'more')}>덜 귀찮게</button><button type="button" data-pref="more"${pressed(p.preference === 'more')}>더 받기</button></div>
          <p class="tiny" data-mt="8">'어디로 보낼까요?'에서 먼저 보여 줄 순서예요.</p></div>
      </div>
      <h2 class="setlabel">화면</h2>
      <div class="setcard"><div class="setblock"><p class="setk">밝기</p>
        <div class="seg">${segThumb}${[['system', '기기 설정'], ['light', '밝게'], ['dark', '어둡게']].map(([k, l]) => `<button type="button" data-theme-set="${k}"${pressed(theme === k)}>${l}</button>`).join('')}</div></div></div>
      <h2 class="setlabel">데이터</h2>
      <div class="setcard list">
        <button type="button" class="setrow2" data-act="export"><span class="setic">${icon('download', 'var(--ink-2)', 20)}</span><span class="grow">내 정리 파일로 저장</span>${chev}</button>
        <button type="button" class="setrow2" data-act="finish"><span class="setic">${icon('discharge', 'var(--ink-2)', 20)}</span><span class="grow">정리 끝내기</span>${chev}</button>
        <button type="button" class="setrow2 danger" data-act="wipe"><span class="setic">${icon('trash', 'currentColor', 20)}</span><span class="grow">정리와 기록 모두 지우기</span></button>
      </div>
      <p class="tiny" data-mt="10" data-mx="4">사진은 저장하지 않아요. 통계도 모으지 않아요. 정리 목록은 이 기기의 브라우저에만 있어요.</p>
      <h2 class="setlabel">정보</h2>
      <div class="setcard list">
        <div class="setrow2 static"><span class="grow">연결 서비스 정보 확인한 날</span><span class="small">${U.fmtMD(C.LINKS_CHECKED)}</span></div>
        <div class="setrow2 static"><span class="grow">버전</span><span class="small">0.1 (2026년 11월)</span></div>
      </div></div>` ,
      after() {
        $$('[data-s-reason]').forEach(b => b.onclick = () => { if (p.reason !== b.dataset.sReason) change(() => { p.reason = b.dataset.sReason; p.title = ST.reasonOf(p.reason).title; }, '정리 이유를 바꿨어요'); });
        $('#s-deadline').onchange = e => { const v = e.target.value; if (!v || v >= TODAY) change(() => { p.deadline = v || null; }, v ? '마감 날짜를 바꿨어요. 계획을 다시 짰어요' : '마감 날짜를 지웠어요'); };
        $$('[data-pref]').forEach(b => b.onclick = () => { if (p.preference !== b.dataset.pref) change(() => { p.preference = b.dataset.pref; }); });
        // 밝기는 예시 정리를 보는 중에도 이 기기에 저장해요 (정리 내용과 상관없는 화면 설정이라서)
        $$('[data-theme-set]').forEach(b => b.onclick = () => { data.settings.theme = b.dataset.themeSet; ST.save(data); applyTheme(); render(true); });
      }
    };
  }

  // F1 다 정리했어요
  function vDone() {
    const p = demo || data.projects[0]; if (!p) return null;
    const done = p.items.filter(PL.isFinished);
    const money = done.reduce((a, i) => a + (i.doneAmount || 0), 0);
    const r = ST.reasonOf(p.reason);
    return { cls: 'flow', html: `<div class="done-hero grow"><div class="big-ok">${icon('check', 'var(--on-accent)', 40, 3)}</div>
      <h1 class="sm">${esc(r.label.split(' ')[0])} 준비, 다 정리했어요</h1>
      <div class="statline"><span>비운 물건 ${done.filter(i => i.state === 'done').length}개</span>${money ? `<span>판 돈 ${P.won(money)}</span>` : ''}<span>나눔 ${done.filter(i => i.route === 'give').length}개</span></div></div>
      <div class="bottom"><a class="btn line" href="#/records">기록 보기</a><button type="button" class="textbtn center" data-act="new">다음 정리 시작</button></div>` };
  }

  // ======================================================================
  // A4 직접 적기 (질문 화면 최대 2장)
  // ======================================================================
  function vAdd(step) {
    const p = proj(); if (!p) return null;
    if (!addDraft) addDraft = ST.newItem((p.items.reduce((m, i) => Math.max(m, i.order), 0)) + 1);
    const a = addDraft;
    if (step === 2 && (!a.name || !a.category)) step = 1;
    if (step === 1) {
      const ok = a.name.trim() && a.category && (a.category !== 'electronics' || a.subtype);
      return { cls: 'flow', html: `${flowbar('물건 추가', '#/home', '1/2')}<div class="pad grow">
        <h1 class="mid">어떤 물건이에요?</h1>
        <label class="field"><span>물건 이름</span><input class="input" id="a-name" value="${esc(a.name)}" placeholder="예: 블루투스 스피커" autocomplete="off" enterkeyhint="next"></label>
        <p class="label">종류</p><div class="pills">${P.CATEGORIES.map(c => `<button type="button" class="pill" data-cat="${c.key}"${pressed(a.category === c.key)}>${c.label}</button>`).join('')}</div>
        ${a.category === 'electronics' ? `<p class="label">어떤 전자기기예요?</p><div class="pills">${P.SUBTYPES.map(s => `<button type="button" class="pill" data-sub="${s.key}"${pressed(a.subtype === s.key)}>${s.label}</button>`).join('')}</div>` : ''}
      </div><div class="bottom"><button type="button" class="btn" data-act="add-next"${ok ? '' : ' disabled'}>다음</button></div>`,
      after() {
        const n = $('#a-name'); n.oninput = () => { a.name = n.value; $('[data-act="add-next"]').disabled = !(a.name.trim() && a.category && (a.category !== 'electronics' || a.subtype)); };
        if (!a.name) n.focus();
        $$('[data-cat]').forEach(b => b.onclick = () => { a.category = b.dataset.cat; if (a.category !== 'electronics') a.subtype = null; a.hasBattery = false; render(true); });
        $$('[data-sub]').forEach(b => b.onclick = () => { a.subtype = b.dataset.sub; a.hasBattery = ['smartphone', 'tablet', 'laptop'].includes(a.subtype); render(true); });
      } };
    }
    const names = P.namesFor(a.category);
    const ok = a.usage && a.defect;
    return { cls: 'flow', html: `${flowbar(a.name, '#/add', '2/2')}<div class="pad grow">
      <h1 class="mid">상태는 어때요?</h1><p class="sub">구매자가 가장 많이 물어보는 부분이에요.</p>
      <p class="label">사용 정도</p><div class="pills">${P.USAGE_KEYS.map((k, i) => `<button type="button" class="pill" data-usage="${k}"${pressed(a.usage === k)}>${names.usage[i]}</button>`).join('')}</div>
      <p class="label">흠이나 하자</p><div class="pills">${P.DEFECT_KEYS.map((k, i) => `<button type="button" class="pill" data-defect="${k}"${pressed(a.defect === k)}>${names.defect[i]}</button>`).join('')}</div>
      ${a.defect && a.defect !== 'none' ? `<label class="field"><span>어디에 어떻게? (선택)</span><input class="input" id="a-note" value="${esc(a.defectNote)}" placeholder="예: 오른쪽 모서리" autocomplete="off"></label>` : ''}
    </div><div class="bottom"><button type="button" class="btn" data-act="add-done"${ok ? '' : ' disabled'}>다음</button></div>`,
    after() {
      $$('[data-usage]').forEach(b => b.onclick = () => { a.usage = b.dataset.usage; render(true); });
      $$('[data-defect]').forEach(b => b.onclick = () => { a.defect = b.dataset.defect; render(true); });
      const n = $('#a-note'); if (n) n.oninput = () => { a.defectNote = n.value; };
    } };
  }
  function addDone() {
    const p = proj(), it = addDraft; addDraft = null;
    it.name = it.name.trim();
    const snap = snapshot();
    p.items.push(it); replan(); persist();
    toast('물건을 추가했어요', snap);
    go('#/item/' + it.id + '/route');
  }

  // ======================================================================
  // A5 어디로 보낼까요
  // ======================================================================
  function routeCard(r, it, flags, sel, rec) {
    const c = priceOf(it), dl = daysLeft(proj());
    const head = `<div class="hd">${ricon(r, 's36')}<b>${rlabel(r)}</b>${rec ? '<span class="chip round c-today" data-px="10">추천</span>' : ''}</div>`;
    const fl = (flags[r] || []).map(f => `<span class="chip c-warn">${esc(f)}</span>`).join('');
    let mid = '';
    if (r === 'sell') mid = `<p class="amt">${c ? `추천 ${P.won(c.low).replace('원', '')} ~ ${P.won(c.high)}` : '살 때 가격을 넣으면 계산해 드려요'}</p><p class="meta">할 일 4개 · 팔릴 때까지 · 직거래나 택배</p>`;
    if (r === 'buyback') mid = `<p class="amt">금액은 매입 업체 견적으로 확인해요</p><div class="grid3"><div><p>할 일</p><p>2개</p></div><div><p>견적</p><p>72시간 안</p></div><div><p>만남</p><p>없어요</p></div></div><p class="tiny" data-mt="10">견적 시간은 번개견적 안내 기준이에요. 조건은 각 서비스에서 확인해요.</p>`;
    if (r === 'consign') mid = '<p class="amt">팔리면 정산돼요 · 금액은 그곳에서 확인해요</p><p class="meta">할 일 2개 · 담아서 내놓기 · 만남 없어요</p>';
    if (r === 'pickup') mid = '<p class="amt">보상은 그곳에서 확인해요</p><p class="meta">할 일 2개 · 문 앞 수거 · 만남 없어요</p>';
    if (r === 'give') mid = `<p class="meta" data-mt="8">할 일 2개 · ${dl != null && dl <= C.GIVE_DAY ? '바로 올려요' : '오늘도 가능해요'}</p>`;
    if (r === 'dispose') mid = '<p class="amt">수수료는 사는 곳 기준으로 확인해요</p><p class="meta">할 일 2개 · 신청하고 내놓기</p>';
    const amtRight = r === 'give' ? '<span data-strong="1">0원</span>' : '';
    return `<button type="button" class="rcard" data-route="${r}"${pressed(sel)}>${head.replace('</b>', '</b>' + amtRight)}${mid}${fl ? `<div class="flags">${fl}</div>` : ''}</button>`;
  }
  function vRoute(id) {
    const it = itemById(id), p = proj(); if (!it) return null;
    const pref = view.pref || p.preference || 'easy';
    const c = priceOf(it), dl = daysLeft(p);
    const sg = RT.suggest(it, pref, dl, c ? c.low : null);
    const list = view.showAll ? sg.routes.concat(RT.ALL.filter(r => !sg.routes.includes(r))) : sg.routes;
    const sel = view.sel && list.includes(view.sel) ? view.sel : (it.route && list.includes(it.route) ? it.route : list[0]);
    return { cls: 'flow', html: `${flowbar(it.name, it.route ? '#/item/' + it.id : '#/home')}<div class="pad grow">
      <h1 class="mid">어디로 보낼까요?</h1>
      <p class="sub">${dl != null ? `${ST.reasonOf(p.reason).until} ${dl}일 · ` : ''}${pref === 'more' ? '더 받을 수 있는 길을 먼저 보여 드려요' : '덜 귀찮은 길을 먼저 보여 드려요'}</p>
      <div class="seg" data-mt="16">${segThumb}<button type="button" data-p="easy"${pressed(pref === 'easy')}>덜 귀찮게</button><button type="button" data-p="more"${pressed(pref === 'more')}>더 받기</button></div>
      <div data-mt="6">${list.map((r, i) => routeCard(r, it, sg.flags, r === sel, i === 0)).join('')}</div>
      <button type="button" class="disclose" data-mt="8" aria-expanded="${view.why}" data-act="why">왜 이 순서일까요?${icon('down', 'var(--ink-3)', 18, 2)}</button>
      ${view.why ? `<p class="why">${esc(sg.why)}</p>` : ''}
      <div class="row2" data-mt="4">${view.showAll ? '<span></span>' : '<button type="button" class="textbtn gray" data-act="all">다른 길 보기</button>'}<button type="button" class="textbtn gray" data-act="keep">계속 쓸게요</button></div>
    </div><div class="bottom"><button type="button" class="btn" data-act="choose" data-r="${sel}">${J.ro(rlabel(sel))} 정하기</button></div>`,
    after() {
      $$('[data-p]').forEach(b => b.onclick = () => { view.pref = b.dataset.p; view.sel = null; render(true); });
      $$('[data-route]').forEach(b => b.onclick = () => { view.sel = b.dataset.route; render(true); });
    } };
  }
  function chooseRoute(it, r) {
    const had = it.route;
    change(() => {
      if (it.route !== r) { it.route = r; it.state = r === 'keep' ? 'kept' : 'todo'; it.quoteAt = null; it.giveNow = null; it.listedAt = null; }
      if (r === 'keep') it.doneAt = TODAY;
      const p = proj(); p.tasks = p.tasks.filter(t => t.itemId !== it.id || t.done && (PL.ROUTE_KINDS[r] || []).includes(t.kind));
    }, had && had !== r ? '길을 바꿨어요' : r === 'keep' ? '계속 쓰기로 했어요' : null);
    view = Object.assign(view, { sel: null, showAll: false, why: false, pref: null });
    go(r === 'keep' ? '#/home' : r === 'sell' && !P.canPrice(it) ? '#/item/' + it.id + '/sell' : '#/item/' + it.id);
  }

  // ======================================================================
  // R1 직접 팔기 — 질문 → 왜 이 가격? + 시세 → 판매글 + 가격 계획
  // ======================================================================
  function sellQuestions(it) {
    if (!it.trade) it.trade = (data.settings && data.settings.lastTrade) || 'both';
    const ok = P.canPrice(it) && (!it.hasBattery || it.battery);
    const opt = (key, list, cur) => `<div class="pills">${list.map(o => `<button type="button" class="pill" data-k="${key}" data-v="${o.key}"${pressed(cur === o.key)}>${o.label}</button>`).join('')}</div>`;
    const isElec = it.category === 'electronics';
    return { cls: 'flow', html: `${flowbar(it.name, '#/item/' + it.id + '/route')}<div class="pad grow" data-pb="8">
      <h1 class="mid">언제, 얼마에 샀어요?</h1><p class="sub">정확하지 않아도 돼요. 대략이면 충분해요.</p>
      <label class="field"><span>살 때 가격 (원)</span><input class="input num" id="q-price" inputmode="numeric" value="${it.purchasePrice ? Number(it.purchasePrice).toLocaleString('ko-KR') : ''}" placeholder="예: 59,000" autocomplete="off"></label>
      <p class="tiny" data-mt="6">기억이 안 나면 지금 파는 새 제품 가격을 적어도 돼요.</p>
      <p class="label">산 지 얼마나 됐어요?</p>${opt('ageBucket', P.AGES, it.ageBucket)}
      <p class="label">구성품</p>${opt('components', P.COMPONENTS, it.components)}
      ${isElec ? `<p class="label">배터리가 있는 물건인가요?</p><div class="pills"><button type="button" class="pill" data-bat="yes"${pressed(it.hasBattery)}>네</button><button type="button" class="pill" data-bat="no"${pressed(!it.hasBattery && it.batteryAsked)}>아니요</button></div>
        ${it.hasBattery ? `<p class="label">배터리 상태</p>${opt('battery', P.BATTERY, it.battery)}` : ''}` : ''}
      <p class="label">거래 방식</p>${opt('trade', P.TRADES, it.trade)}
      <label class="field"><span>모델명 (선택)</span><input class="input" id="q-model" value="${esc(it.model || '')}" placeholder="예: JBL Flip 5" autocomplete="off"></label>
      <p class="tiny" data-mt="6">시세를 찾을 때 검색어로 써요.</p>
    </div><div class="bottom"><button type="button" class="btn" data-act="to-price"${ok ? '' : ' disabled'}>가격 보기</button></div>`,
    after() {
      const pr = $('#q-price');
      const sync = () => { $('[data-act="to-price"]').disabled = !(P.canPrice(it) && (!it.hasBattery || it.battery)); };
      pr.oninput = () => { it.purchasePrice = P.toInt(pr.value) || null; sync(); };
      pr.onblur = () => { if (it.purchasePrice) pr.value = Number(it.purchasePrice).toLocaleString('ko-KR'); persist(); };
      $('#q-model').oninput = e => { it.model = e.target.value.trim() || null; };
      $$('[data-k]').forEach(b => b.onclick = () => { it[b.dataset.k] = b.dataset.v; if (b.dataset.k === 'trade' && !demo) data.settings.lastTrade = b.dataset.v; persist(); render(true); });
      $$('[data-bat]').forEach(b => b.onclick = () => { it.hasBattery = b.dataset.bat === 'yes'; it.batteryAsked = true; if (!it.hasBattery) it.battery = null; persist(); render(true); });
    } };
  }
  function marketChart(c, prices) {
    const xs = prices.map(P.toInt).filter(x => x > 0);
    const all = xs.concat([c.low, c.high]);
    let lo = Math.min(...all), hi = Math.max(...all);
    const padv = (hi - lo) * .12 || hi * .1; lo -= padv; hi += padv;
    const W = 300, x = v => 4 + (v - lo) / (hi - lo) * (W - 8);
    const mid = P.marketMid(xs);
    const dots = xs.map(v => `<circle cx="${x(v).toFixed(1)}" cy="24" r="5" fill="var(--info-dot)"/>`).join('');
    const label = `추천 범위 ${P.won(c.low)}에서 ${P.won(c.high)}, 내가 찾은 시세 ${xs.map(P.won).join(', ')}, 가운데 ${P.won(Math.round(mid))}`;
    const mx = Math.min(Math.max(x(mid), 60), W - 60);
    return `<svg viewBox="0 0 ${W} 58" width="100%" role="img" aria-label="${esc(label)}" class="chart">
      <text x="${x(c.low).toFixed(1)}" y="11" font-size="11" font-weight="700" fill="var(--accent-ink)">추천</text>
      <rect x="0" y="22" width="${W}" height="4" rx="2" fill="var(--line)"/>
      <rect x="${x(c.low).toFixed(1)}" y="18" width="${(x(c.high) - x(c.low)).toFixed(1)}" height="12" rx="6" fill="var(--chart-range)"/>
      ${dots}<circle cx="${x(mid).toFixed(1)}" cy="24" r="7" fill="var(--surface)" stroke="var(--info-dot)" stroke-width="2"/><circle cx="${x(mid).toFixed(1)}" cy="24" r="4" fill="var(--info-dot)"/>
      <text x="${mx.toFixed(1)}" y="50" font-size="11" font-weight="700" fill="var(--info-ink)" text-anchor="middle">시세 가운데 ${P.won(Math.round(mid))}</text></svg>`;
  }
  function sellPrice(it) {
    const c = priceOf(it);
    if (!c) return sellQuestions(it);
    if (!it.finalPrice) it.finalPrice = c.start;
    const mp = (it.marketPrices || []).filter(x => x > 0);
    const cmp = P.compare(mp, c.low, c.high);
    const q = `${(it.model || it.name)} 중고`;
    return { cls: 'flow', html: `${flowbar(it.name, '#/item/' + it.id + '/sell')}<div class="pad grow" data-pb="8">
      <p class="sub" data-mt="6" data-strong5="1">직접 팔기 · 추천 가격</p>
      <p class="price-big">${P.won(c.low).replace('원', '')} ~ ${P.won(c.high)}</p>
      <section class="card gray" aria-label="왜 이 가격일까요" data-mt="18">
        <h2 class="sec">왜 이 가격일까요?</h2>
        <p class="small" data-mt="2" data-mb="6">살 때 ${P.won(c.purchase)}에 아래 비율을 차례로 곱했어요</p>
        ${c.steps.map(s => `<div class="steprow"><span>${esc(s.label)}</span><b>× ${P.pct(s.ratio)}</b></div>`).join('')}
        <div class="sumrow"><b>가운데 약 ${P.won(c.midRounded)}</b><span class="small">앞뒤 10%씩</span></div>
        <p class="tiny" data-mt="10">이 비율은 실마리가 정한 대략적인 기준이에요. 실제 시세와 다를 수 있어요.</p>
      </section>
      <section class="card lined" aria-label="내가 찾은 시세" data-mt="12" data-pt="8">
        <div class="hd2"><h2 class="sec">내가 찾은 시세</h2>${mp.length < 3 ? '<button type="button" class="textbtn" data-act="add-market">+ 추가</button>' : ''}</div>
        ${mp.length ? `<div class="mchips">${mp.map((v, i) => `<span class="mchip">${P.won(v)}<button type="button" data-rm="${i}" aria-label="${P.won(v)} 지우기">${icon('x', 'currentColor', 14, 2.2)}</button></span>`).join('')}</div>` : '<p class="small" data-mt="0">당근 같은 곳에서 비슷한 물건 가격을 찾아 1~3개 적어 보세요. 건너뛰어도 돼요.</p>'}
        ${view.addingMarket ? `<div class="addrow"><input class="input num" id="m-in" inputmode="numeric" placeholder="예: 25,000" aria-label="찾은 시세 (원)" autocomplete="off"><button type="button" class="btn" data-act="market-save">넣기</button></div>` : ''}
        ${cmp ? marketChart(c, mp) + `<p class="infobox">${esc(cmp.text)}${cmp.extra.map(e => '<br>' + esc(e)).join('')}</p>` : ''}
        <button type="button" class="disclose" aria-expanded="${!!view.tips}" data-act="tips">시세 찾는 요령${icon('down', 'var(--ink-3)', 18, 2)}</button>
        ${view.tips ? `<ol class="tips"><li>같은 모델, 비슷한 상태의 물건을 골라요.</li><li>업자 글보다 개인이 올린 글을 봐요.</li><li>가능하면 거래가 끝난 글의 가격을 적어요.</li></ol>
          <button type="button" class="btn soft" data-mt="10" data-act="copy-q">${icon('copy', 'var(--ink)', 16)}검색어 복사 · ${esc(q)}</button>` : ''}
      </section>
      <label class="field"><span>올릴 가격 (원)</span><input class="input num" id="final" inputmode="numeric" value="${Number(it.finalPrice).toLocaleString('ko-KR')}" autocomplete="off"></label>
      <p class="tiny" data-mt="6">처음 값은 추천 범위의 가운데예요. 시세를 적어도 저절로 바뀌지 않아요.</p>
    </div><div class="bottom"><button type="button" class="btn" data-act="to-draft">${P.won(it.finalPrice)}으로 판매글 만들기</button></div>`,
    after() {
      const f = $('#final');
      f.oninput = () => { const v = P.toInt(f.value); const b = $('[data-act="to-draft"]'); b.disabled = !v; b.textContent = v ? `${P.won(v)}으로 판매글 만들기` : '올릴 가격을 적어 주세요'; };
      f.onchange = () => { const v = P.toInt(f.value); if (v) { it.finalPrice = v; if (it.draft.body) it.draft.body = D.replacePrice(it.draft.body, v); persist(); } };
      const m = $('#m-in'); if (m) { m.focus(); m.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('[data-act="market-save"]').click(); } }; }
      $$('[data-rm]').forEach(b => b.onclick = () => { it.marketPrices.splice(+b.dataset.rm, 1); persist(); render(true); });
    } };
  }
  function ensureDraft(it) {
    const gen = D.sale(it);
    if (!it.draft.body || !it.draft.edited) { it.draft.title = gen.title; it.draft.body = gen.body; it.draft.edited = false; }
    else it.draft.body = D.replacePrice(it.draft.body, it.finalPrice);
  }
  function sellDraft(it) {
    const c = priceOf(it); if (!c) return sellQuestions(it);
    if (!it.finalPrice) it.finalPrice = c.start;
    ensureDraft(it);
    const p = proj(), mp = (it.marketPrices || []).filter(x => x > 0);
    const drop = p.tasks.find(t => t.itemId === it.id && t.kind === 'drop_price');
    const sw = p.tasks.find(t => t.itemId === it.id && t.kind === 'switch_route');
    const sugg = P.dropSuggestion(it.finalPrice, c.low, mp);
    const planBox = drop && sw ? `<section class="card lined" aria-label="마감에 맞춘 가격 계획" data-mt="14">
        <h2 class="sec" data-mb="6">마감에 맞춘 가격 계획</h2>
        <div class="plrow"><i data-bg="var(--accent)"></i><span class="grow">지금 ~ ${U.fmtMD(U.addDays(drop.date, -1)).replace(/ \(.\)$/, '')}</span><b>${P.won(it.finalPrice)}</b></div>
        <div class="plrow"><i data-bg="var(--warn-dot)"></i><span class="grow">${U.fmtMD(drop.date).replace(/ \(.\)$/, '')}부터 (D-${U.diffDays(drop.date, p.deadline)})</span><b>${P.won(sugg)}</b></div>
        <div class="plrow"><i data-bg="var(--give-ic)"></i><span class="grow">${U.fmtMD(sw.date).replace(/ \(.\)$/, '')}에도 남으면</span><b>${RT.isBuybackable(it) ? '매입·나눔으로' : '나눔으로'}</b></div>
        <p class="tiny" data-mt="6">안 팔렸을 때만 하는 제안이에요. 바꾸기 전에 물어볼게요.</p></section>` : '';
    const doing = it.state === 'doing';
    return { cls: 'flow', html: `${flowbar(it.name, '#/item/' + it.id + '/sell/price')}<div class="pad grow" data-pb="24">
      <div class="brand" data-gap="10" data-mt="4"><span class="okmark">${icon('check', 'var(--accent)', 18, 2.6)}</span><h1 class="sm">${doing ? `${P.won(it.finalPrice)}에 올렸어요` : '판매글이 준비됐어요'}</h1></div>
      <p class="sub" data-mt="8">${doing ? '팔리면 아래 [팔았어요]를 눌러 주세요.' : '복사해서 쓰는 중고거래 앱에 붙여 넣으면 돼요.'}</p>
      ${mp.length ? `<p class="band info">적어 둔 시세 ${mp.map(v => v.toLocaleString('ko-KR')).join(' · ')}원 (가운데 ${P.won(Math.round(P.marketMid(mp)))})</p>` : ''}
      <section class="draftbox" aria-label="판매글 초안">
        <div class="hd"><span class="tiny" data-strong="1">제목</span><button type="button" class="textbtn" data-act="edit-draft">${view.editDraft ? '다 고쳤어요' : '고치기'}</button></div>
        ${view.editDraft ? `<input class="input" id="d-title" value="${esc(it.draft.title)}" aria-label="제목"><textarea class="input" id="d-body" data-mt="8" aria-label="본문">${esc(it.draft.body)}</textarea>`
          : `<p class="ttl">${esc(it.draft.title)}</p><div class="bd">${esc(it.draft.body)}</div>`}
      </section>
      <div class="row2" data-mt="12"><button type="button" class="btn h52" data-act="copy-draft">${icon('copy', 'var(--on-accent)', 18, 2)}판매글 복사</button>
        ${doing ? '<button type="button" class="btn h52 line" data-act="sold">팔았어요</button>' : '<button type="button" class="btn h52 line" data-act="listed">올렸어요</button>'}</div>
      ${view.soldOpen ? `<div class="addrow"><input class="input num" id="sold-amt" inputmode="numeric" placeholder="받은 금액 (선택)" aria-label="받은 금액 (선택)"><button type="button" class="btn" data-act="sold-save">끝내기</button></div>` : ''}
      ${doing && sugg < it.finalPrice ? `<div class="status" data-mt="12">안 팔리면 ${J.ro(P.won(sugg))} 내려 볼 수 있어요.<button type="button" class="textbtn" data-act="drop" data-v="${sugg}">이 가격으로 바꾸기</button></div>` : ''}
      ${planBox}
      <button type="button" class="textbtn center gray" data-mt="8" data-act="reroute">다른 길로 바꾸기</button>
    </div>`,
    after() {
      const tt = $('#d-title'), bd = $('#d-body');
      if (tt) tt.oninput = () => { it.draft.title = tt.value; it.draft.edited = true; persist(); };
      if (bd) bd.oninput = () => { it.draft.body = bd.value; it.draft.edited = true; persist(); };
    } };
  }

  // ======================================================================
  // R2~R6 길별 안내
  // ======================================================================
  function vGo(it) {
    const r = it.route, p = proj();
    const svc = (SERVICES[r] || []).filter(s => !s.only || s.only.includes(it.subtype));
    const svcHtml = svc.map(s => `<div class="svc"><div class="hd"><b>${esc(s.name)}</b><a class="open" href="${s.url}" target="_blank" rel="noopener noreferrer">열기${icon('ext', 'var(--ink)', 14)}</a></div><p>${esc(s.desc)}</p>${s.src ? `<p class="tiny">${esc(s.src)}</p>` : ''}</div>`).join('');
    const checked = svc.length ? `<p class="tiny" data-mt="8">링크 확인 ${U.fmtMD(C.LINKS_CHECKED)}. 조건은 바뀔 수 있어서 그곳에서 확인해요. 링크에는 물건 정보를 싣지 않아요.</p>` : '';
    const nextT = p.tasks.find(t => t.itemId === it.id && !t.done);
    const when = nextT ? `<p class="small" data-mt="10">계획: ${U.fmtMD(nextT.date)} · ${esc(taskText(nextT, it))}</p>` : '';
    const st = it.state;
    let title, intro, steps = '', body = '', actions = '';
    if (r === 'buyback') {
      title = '바로 매입'; intro = '사진과 상태를 보내면 견적이 와요. 금액은 매입 업체 견적으로 확인해요.';
      steps = `<div class="steps2"><div class="${st === 'todo' ? 'on' : ''}"><b>① 견적 신청</b>${st !== 'todo' ? '했어요' : '할 일'}</div><div class="${st === 'doing' ? 'on' : ''}"><b>② 물건 보내기</b>${it.quoteAt ? '견적 받음' : '견적 받은 뒤'}</div></div>`;
      if (!svc.length) body = '<p class="band gray">이 물건은 연결해 둔 매입 서비스의 품목이 아니에요. 다른 길도 살펴보세요.</p>';
      actions = st === 'todo' ? '<button type="button" class="btn" data-act="applied">신청했어요</button>'
        : st === 'doing' ? `<div class="row2">${it.quoteAt ? '<span></span>' : '<button type="button" class="btn line" data-act="quote">견적 받았어요</button>'}<button type="button" class="btn" data-act="sold">팔았어요</button></div>` : '';
    }
    if (r === 'consign') { title = '맡기기'; intro = '가방을 신청 → 담아서 내놓기 → 팔리면 정산돼요.'; actions = st === 'todo' ? '<button type="button" class="btn" data-act="applied">신청했어요</button>' : ''; }
    if (r === 'pickup') { title = '수거'; intro = '신청하면 문 앞에서 가져가요.'; actions = st === 'todo' ? '<button type="button" class="btn" data-act="applied">신청했어요</button>' : ''; }
    if (r === 'dispose') {
      title = '버리기'; intro = '사는 곳 구청·주민센터에 대형 폐기물을 신청하거나 수거 앱(예: 빼기)을 써요. 수수료는 사는 곳 기준으로 확인해요.';
      body = st === 'done' ? (it.putOut ? `<p class="small" data-mt="10">내놓는 날: ${U.fmtMD(it.putOut)}</p>` : '') : `<label class="field"><span>내놓는 날 (선택)</span><input class="input" type="date" id="putout" min="${TODAY}" value="${it.putOut || ''}"></label>`;
      actions = st === 'todo' ? '<button type="button" class="btn" data-act="applied">신청했어요</button>' : '';
    }
    if (r === 'give') {
      title = '나눔'; intro = '나눔 글은 실마리가 써 둬요. 복사해서 올리고, 전달하면 끝이에요.';
      if (!it.trade) it.trade = (data.settings && data.settings.lastTrade) || 'direct';
      const g = D.give(it);
      if (!it.draft.edited || !it.draft.body || it.draft.kind !== 'give') { it.draft = { title: g.title, body: g.body, edited: false, byAI: false, kind: 'give' }; }
      body = `<p class="label">받는 방법</p><div class="pills">${P.TRADES.map(o => `<button type="button" class="pill" data-trade="${o.key}"${pressed(it.trade === o.key)}>${o.label}</button>`).join('')}</div>
        <section class="draftbox" aria-label="나눔 글"><div class="hd"><span class="tiny" data-strong="1">제목</span><button type="button" class="textbtn" data-act="copy-draft">${icon('copy', 'var(--accent)', 16)} 복사</button></div>
        <p class="ttl">${esc(it.draft.title)}</p><textarea class="input" id="g-body" aria-label="나눔 글 본문" data-minh="180">${esc(it.draft.body)}</textarea></section>
        ${st === 'todo' && !it.giveNow ? '<button type="button" class="textbtn" data-act="give-now">오늘 올릴래요</button>' : ''}`;
      actions = st === 'todo' ? '<button type="button" class="btn" data-act="applied">올렸어요</button>' : st === 'doing' ? '<button type="button" class="btn" data-act="handed">전달했어요</button>' : '';
    }
    if (r === 'keep') { title = '계속 쓰기'; intro = '이 물건은 계속 쓰기로 했어요.'; }
    const doneMsg = st === 'done' ? `<div class="status">${{ give: '전달했어요', buyback: '팔았어요' }[r] || '신청했어요'} · ${it.doneAt ? U.fmtMD(it.doneAt) : ''}</div>` : st === 'doing' && r === 'give' ? '<div class="status">나눔 글을 올렸어요</div>' : st === 'doing' && r === 'buyback' ? `<div class="status">${it.quoteAt ? '견적을 받았어요. 물건을 보내 주세요.' : '견적을 기다리는 중이에요'}</div>` : '';
    return { cls: 'flow', html: `${flowbar(it.name, '#/home')}<div class="pad grow" data-pb="8">
      <h1 class="mid">${esc(title)}</h1><p class="sub">${esc(intro)}</p>
      ${r !== 'keep' && r !== 'give' ? `<p class="small" data-mt="8">할 일 ${RT.ROUTES[r].tasks}개${r === 'buyback' ? ' · 견적 72시간 안 · 만남 없어요' : ''}</p>` : ''}
      ${steps}${doneMsg}${body}${svcHtml}${checked}${st !== 'done' ? when : ''}
      ${view.soldOpen ? `<div class="addrow"><input class="input num" id="sold-amt" inputmode="numeric" placeholder="받은 금액 (선택)" aria-label="받은 금액 (선택)"><button type="button" class="btn" data-act="sold-save">끝내기</button></div>` : ''}
      <button type="button" class="textbtn center gray" data-mt="8" data-act="reroute">다른 길로 바꾸기</button>
    </div>${actions ? `<div class="bottom">${actions}</div>` : ''}`,
    after() {
      $$('[data-trade]').forEach(b => b.onclick = () => { it.trade = b.dataset.trade; if (!demo) data.settings.lastTrade = it.trade; it.draft.edited = false; persist(); render(true); });
      const gb = $('#g-body'); if (gb) gb.oninput = () => { it.draft.body = gb.value; it.draft.edited = true; persist(); };
      const po = $('#putout'); if (po) po.onchange = () => { it.putOut = po.value || null; persist(); };
    } };
  }

  // ---------- 물건 화면 고르기 ----------
  function vItem(id, sub) {
    const it = itemById(id); if (!it) return null;
    if (sub === 'route' || !it.route) return vRoute(id);
    if (it.route === 'sell') {
      if (sub === 'sell') return sellQuestions(it);
      if (sub === 'sell/price') return sellPrice(it);
      if (sub === 'sell/draft' || it.state !== 'todo') return sellDraft(it);
      // 주소를 정확한 단계로 맞춰요 (답하는 도중에 다음 화면으로 넘어가지 않게)
      setTimeout(() => location.replace('#/item/' + id + (P.canPrice(it) ? '/sell/price' : '/sell')), 0);
      return P.canPrice(it) ? sellPrice(it) : sellQuestions(it);
    }
    return vGo(it);
  }

  // ======================================================================
  // 누르는 동작 (한 곳에서 처리)
  // ======================================================================
  async function copy(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (e) { toast('복사가 안 돼요. 글을 길게 눌러 복사해 주세요.'); }
  }
  function currentItem() { const m = location.hash.match(/^#\/item\/([^/]+)/); return m ? itemById(m[1]) : null; }
  const ACTS = {
    start: doStart,
    demo() { demo = ST.example(TODAY); go('#/home'); },
    'exit-demo'() { demo = null; view = { pref: null }; go(proj() ? '#/home' : '#/start'); },
    'go-settings'() { go('#/settings'); },
    finish() { if (!demo) { const p = proj(); p.finishedAt = new Date().toISOString(); persist(); } go('#/done'); },
    new() { if (demo) { demo = null; } go('#/start'); },
    export() {
      const blob = new Blob([JSON.stringify(demo || data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `silmari-${TODAY}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    wipe() { $('#confirm').showModal(); },
    'add-next'() { go('#/add/2'); },
    'add-done': addDone,
    why() { view.why = !view.why; render(true); },
    all() { view.showAll = true; render(true); },
    keep() { const it = currentItem(); if (it) chooseRoute(it, 'keep'); },
    choose(b) { const it = currentItem(); if (it) chooseRoute(it, b.dataset.r); },
    'to-price'() { const it = currentItem(); persist(); go('#/item/' + it.id + '/sell/price'); },
    'add-market'() { view.addingMarket = true; render(true); },
    'market-save'() { const it = currentItem(), v = P.toInt($('#m-in').value); if (v) { it.marketPrices = (it.marketPrices || []).concat(v).slice(0, 3); persist(); } view.addingMarket = false; render(true); },
    tips() { view.tips = !view.tips; render(true); },
    'copy-q'() { const it = currentItem(); copy(`${it.model || it.name} 중고`, '검색어를 복사했어요. 쓰는 중고거래 앱에서 찾아보세요.'); },
    'to-draft'() { const it = currentItem(), v = P.toInt($('#final').value); if (!v) return; it.finalPrice = v; ensureDraft(it); persist(); go('#/item/' + it.id + '/sell/draft'); },
    'edit-draft'() { view.editDraft = !view.editDraft; render(true); },
    'copy-draft'() { const it = currentItem(); copy(it.draft.title + '\n\n' + it.draft.body, '판매글을 복사했어요. 앱에 붙여 넣으면 돼요.'.replace('판매글', it.route === 'give' ? '나눔 글' : '판매글')); },
    listed() { const it = currentItem(); change(() => markStart(it, 'post_sale'), '올렸어요로 표시했어요'); go('#/home'); },
    sold() { view.soldOpen = true; render(true); },
    'sold-save'() { const it = currentItem(), v = P.toInt($('#sold-amt').value); view.soldOpen = false;
      change(() => { it.state = 'done'; it.doneAt = TODAY; it.doneAmount = v || null; }, '팔았어요로 표시했어요'); go('#/home'); },
    drop(b) { const it = currentItem(), v = +b.dataset.v; change(() => { it.finalPrice = v; it.draft.body = D.replacePrice(it.draft.body, v);
      const t = proj().tasks.find(x => x.itemId === it.id && x.kind === 'drop_price'); if (t) { t.done = true; t.doneAt = TODAY; } }, `${J.ro(P.won(v))} 바꿨어요. 앱에 올린 글은 직접 고쳐 주세요`); },
    reroute() { const it = currentItem(); view.sel = null; go('#/item/' + it.id + '/route'); },
    applied() { const it = currentItem(); const k = PL.START_KIND[it.route] || (it.route === 'give' ? 'post_give' : 'apply_dispose');
      change(() => markStart(it, k), it.route === 'give' ? '올렸어요로 표시했어요' : '신청했어요로 표시했어요'); if (it.state === 'done') go('#/home'); },
    quote() { const it = currentItem(); change(() => { it.quoteAt = TODAY; }, '견적을 받았어요. 보내는 날을 계획에 넣었어요'); },
    handed() { const it = currentItem(); change(() => { it.state = 'done'; it.doneAt = TODAY; }, '전달했어요로 표시했어요'); go('#/home'); },
    'give-now'() { const it = currentItem(); change(() => { it.giveNow = TODAY; }, '오늘 할 일에 넣었어요'); }
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act],[data-done],[data-del]');
    if (!b) return;
    if (b.dataset.done) {
      const p = proj(), t = p.tasks.find(x => x.id === b.dataset.done);
      if (t) change(() => completeTask(t), '완료로 표시했어요');
      return;
    }
    if (b.dataset.del) {
      const p = proj(), it = itemById(b.dataset.del);
      change(() => { p.items = p.items.filter(i => i !== it); p.tasks = p.tasks.filter(t => t.itemId !== it.id); }, `${it.name} 지웠어요`);
      return;
    }
    const fn = ACTS[b.dataset.act]; if (fn) fn(b);
  });
  document.addEventListener('change', e => {
    const id = e.target.dataset && e.target.dataset.date;
    if (!id) return;
    const p = proj(), t = p.tasks.find(x => x.id === id), v = e.target.value;
    if (t && v && v >= TODAY) change(() => { t.date = v; t.userEdited = true; }, '날짜를 바꿨어요');
  });
  $('#confirm-ok').onclick = () => { ST.clearAll(); data = ST.empty(); demo = null; $('#confirm').close(); go('#/start'); };
  $('#confirm-no').onclick = () => $('#confirm').close();

  // ======================================================================
  // 화면 그리기
  // ======================================================================
  let lastHash = '';
  const DEPTH = h => (h.match(/\//g) || []).length;
  function render(keep) {
    const h = location.hash || '#/';
    let m, v = null;
    const p = proj();
    // 할 일이 다 끝났으면 한 번 '다 정리했어요'
    if (p && !demo && p.items.length && p.items.every(PL.isFinished) && !p.celebrated && h === '#/home') { p.celebrated = true; persist(); return go('#/done'); }
    const dm = h.match(/^#\/demo(\/.*)?$/);                                      // 허브의 [예시 정리 보기]
    if (dm) { demo = ST.example(TODAY); return location.replace('#' + (dm[1] || '/home')); }
    if (h === '#/' || h === '#/start') v = p && h !== '#/start' ? vHome() : vStart();
    else if (h === '#/home') v = vHome();
    else if (h === '#/plan') v = vPlan();
    else if (h === '#/records') v = vRecords();
    else if (h === '#/items') v = vItems();
    else if (h === '#/settings') v = vSettings();
    else if (h === '#/done') v = vDone();
    else if (h === '#/add') v = vAdd(1);
    else if (h === '#/add/2') v = vAdd(2);
    else if ((m = h.match(/^#\/item\/([^/]+)(?:\/(.+))?$/))) v = vItem(m[1], m[2]);
    if (!v) { if (h !== '#/start') return go(p ? '#/home' : '#/start'); v = vStart(); }

    const root = $('#view');
    const navigating = !keep && h !== lastHash;
    const fromTab = TAB_IDX[lastHash] != null, toTab = TAB_IDX[h] != null;
    const dir = fromTab && toTab ? 'fade' : DEPTH(h) >= DEPTH(lastHash) ? 'fwd' : 'back';
    const paint = () => {
      root.className = 'view ' + (v.cls === 'flow' ? 'flow' : 'tab');
      if (navigating) root.innerHTML = v.html;
      else { const tmp = document.createElement('main'); tmp.innerHTML = v.html; morphChildren(root, tmp); }   // 바뀐 곳만 고쳐요
      decorate(root);
      setDock(h);
      if (v.after) v.after();
      if (navigating) {
        window.scrollTo(0, 0);
        const t = root.querySelector('h1'); if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
      }
    };
    // 탭끼리(정리·계획·기록)는 기다림 없이 바로 바꾸고 살짝만 나타나게 해요. 화면 전환 효과는 물건 화면을 오갈 때만 써요.
    if (navigating && dir !== 'fade' && document.startViewTransition && !reduceMotion()) {
      document.documentElement.dataset.dir = dir;
      document.startViewTransition(paint);                     // 이전 화면과 새 화면이 부드럽게 겹쳐 넘어가요
    } else {
      paint();
      if (navigating && !reduceMotion()) { root.classList.remove('anim-fwd', 'anim-back', 'anim-fade'); void root.offsetWidth; root.classList.add('anim-' + dir); }
    }
    if (navigating) {
      if (!/^#\/item\//.test(h) || h.split('/')[2] !== (lastHash.split('/')[2])) view = { pref: null };
      if (!/^#\/add/.test(h)) addDraft = null;
    }
    lastHash = h;
    document.title = '실마리';
  }

  // ---------- 화면을 부드럽게: 통째로 다시 그리지 않고 바뀐 곳만 고치기 ----------
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function syncAttrs(a, b) {
    for (const at of Array.from(a.attributes)) if (at.name !== 'style' && !b.hasAttribute(at.name)) a.removeAttribute(at.name);
    for (const at of Array.from(b.attributes)) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    if (a.tagName === 'INPUT' && a !== document.activeElement) {
      if (a.type === 'checkbox' || a.type === 'radio') a.checked = b.hasAttribute('checked'); else a.value = b.getAttribute('value') || '';
    }
    if (a.tagName === 'TEXTAREA' && a !== document.activeElement && a.value !== b.value) a.value = b.value;
  }
  function morphChildren(from, to) {
    const f = Array.from(from.childNodes), t = Array.from(to.childNodes);
    t.forEach((tn, i) => {
      const fn = f[i];
      if (!fn) { from.appendChild(tn); return; }
      if (fn.nodeType !== tn.nodeType || fn.nodeName !== tn.nodeName || (fn.nodeType === 1 && (fn.id || '') !== (tn.id || ''))) { from.replaceChild(tn, fn); return; }
      if (fn.nodeType !== 1) { if (fn.nodeValue !== tn.nodeValue) fn.nodeValue = tn.nodeValue; return; }
      syncAttrs(fn, tn);
      if (fn.tagName !== 'TEXTAREA') morphChildren(fn, tn);
    });
    for (let i = t.length; i < f.length; i++) f[i].remove();
  }

  // ---------- 떠 있는 탭 바 (화면이 바뀌어도 그대로 있고, 초록 알약만 미끄러져요) ----------
  const TAB_IDX = { '#/home': 0, '#/plan': 1, '#/records': 2 };
  function setDock(h) {
    const dock = $('#tabdock'), i = TAB_IDX[h];
    dock.hidden = i == null;
    if (i == null) return;
    dock.querySelector('.tabbar').style.setProperty('--i', i);
    $$('.tabbar a', dock).forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }

  // 스타일 속성 없이 값 넣기 (CSP: 인라인 스타일 금지)
  function decorate(root) {
    // 고르는 막대(덜 귀찮게|더 받기 등): 고른 칸 아래 하얀 알약이 미끄러져요
    $$('.seg', root).forEach(s => { const bs = $$('button', s); s.style.setProperty('--n', bs.length); s.style.setProperty('--i', Math.max(0, bs.findIndex(b => b.getAttribute('aria-pressed') === 'true'))); });
    $$('[data-mt]', root).forEach(el => el.style.marginTop = el.dataset.mt + 'px');
    $$('[data-mb]', root).forEach(el => el.style.marginBottom = el.dataset.mb + 'px');
    $$('[data-my]', root).forEach(el => { el.style.marginTop = el.style.marginBottom = el.dataset.my + 'px'; });
    $$('[data-mx]', root).forEach(el => { el.style.marginLeft = el.style.marginRight = el.dataset.mx + 'px'; });
    $$('[data-pt]', root).forEach(el => el.style.paddingTop = el.dataset.pt + 'px');
    $$('[data-pb]', root).forEach(el => el.style.paddingBottom = el.dataset.pb + 'px');
    $$('[data-px]', root).forEach(el => { el.style.paddingLeft = el.style.paddingRight = el.dataset.px + 'px'; });
    $$('[data-gap]', root).forEach(el => el.style.gap = el.dataset.gap + 'px');
    $$('[data-w]', root).forEach(el => { if (el.tagName === 'I') el.style.width = el.dataset.w + '%'; else el.style.width = el.dataset.w + 'px'; });
    $$('[data-bg]', root).forEach(el => el.style.background = el.dataset.bg);
    $$('[data-strong]', root).forEach(el => { el.style.fontWeight = '700'; el.style.color = 'var(--ink)'; });
    $$('[data-strong5]', root).forEach(el => { el.style.fontWeight = '500'; });
    $$('[data-block]', root).forEach(el => el.style.display = 'block');
    $$('[data-minh]', root).forEach(el => el.style.minHeight = el.dataset.minh + 'px');
    $$('.hd2', root).forEach(el => { el.style.display = 'flex'; el.style.justifyContent = 'space-between'; el.style.alignItems = 'center'; });
  }
  // 날짜 칸: 컴퓨터에서 눌러도 달력이 바로 열리게 (전에는 칸만 선택되고 달력이 안 열렸어요)
  document.addEventListener('click', e => {
    const inp = e.target.closest && e.target.closest('input[type=date]');
    if (inp) { try { inp.showPicker(); } catch (err) { /* 지원 안 하는 브라우저는 기본 동작 */ } }
    const db = e.target.closest && e.target.closest('[data-pick]');
    if (db) { const i = document.getElementById(db.dataset.pick); if (i) { try { i.showPicker(); } catch (err) { i.focus(); } } }
  });
  window.addEventListener('hashchange', () => render());
  applyTheme();
  replan();
  render();
})(window.S = window.S || {});
