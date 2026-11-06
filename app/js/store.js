/* 저장 — 15번 기획서 12장. 이 기기의 브라우저 저장소 'silmari.v2' 한 곳에만 저장해요. 사진은 저장하지 않아요. */
(function (S) {
  'use strict';
  const KEY = 'silmari.v2';
  const U = S.util;

  const empty = () => ({ v: 2, projects: [], settings: { lastTrade: 'both' } });

  let available = true;
  try { const k = KEY + '.test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); }
  catch (e) { available = false; }

  function load() {
    if (!available) return empty();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const d = JSON.parse(raw);
      return d && d.v === 2 && Array.isArray(d.projects) ? Object.assign(empty(), d) : empty();
    } catch (e) { return empty(); }
  }
  function save(data) {
    if (!available) return false;
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  function clearAll() { try { localStorage.removeItem(KEY); } catch (e) {} }

  const REASONS = [
    { key: 'move',     label: '이사',             title: '이사 정리',  day: '이사하는 날',  until: '이사까지' },
    { key: 'discharge',label: '전역',             title: '전역 정리',  day: '전역하는 날',  until: '전역까지' },
    { key: 'graduate', label: '졸업 · 기숙사 퇴사', title: '졸업 정리',  day: '나가는 날',    until: '나가는 날까지' },
    { key: 'marry',    label: '결혼 · 합가',       title: '합가 정리',  day: '합치는 날',    until: '합치는 날까지' },
    { key: 'just',     label: '그냥 정리할래요',    title: '물건 정리',  day: '정리 마감',    until: '마감까지' }
  ];
  const reasonOf = k => REASONS.find(r => r.key === k) || REASONS[4];

  function newProject(reason, deadline, now) {
    return { id: U.uid(), reason, title: reasonOf(reason).title, deadline: deadline || null, preference: 'easy',
      createdAt: now || new Date().toISOString(), finishedAt: null, items: [], tasks: [] };
  }
  function newItem(order) {
    return { id: U.uid(), order, name: '', model: null, category: null, subtype: null,
      purchasePrice: null, ageBucket: null, usage: null, defect: null, defectNote: '',
      hasBattery: false, battery: null, components: null, trade: null, extra: [], marketPrices: [],
      route: null, finalPrice: null, draft: { title: '', body: '', edited: false, byAI: false },
      state: 'todo', listedAt: null, doneAt: null, doneAmount: null, quoteAt: null, giveNow: null };
  }

  /** 17-2 예시 정리. 날짜는 '오늘'을 기준으로 맞춰요(오늘 = 11/6이면 기획서와 똑같아요). 가짜 데이터예요. */
  function example(today) {
    const p = newProject('move', U.addDays(today, 27));
    p.id = 'example';
    const mk = (order, o) => Object.assign(newItem(order), { id: 'ex' + order }, o);
    p.items = [
      mk(1, { name: '아이폰 11 프로', category: 'electronics', subtype: 'smartphone', usage: 'sometimes', defect: 'minor', route: 'buyback' }),
      mk(2, { name: '블루투스 스피커', category: 'electronics', subtype: 'electronics_other', purchasePrice: 59000, ageBucket: '1y2y',
        usage: 'sometimes', defect: 'minor', defectNote: '', hasBattery: true, battery: 'ge90', components: 'partial', trade: 'both',
        route: 'sell', finalPrice: 24000, marketPrices: [25000, 28000, 30000] }),   // 예시 시세 (가짜 값)
      mk(3, { name: '빔프로젝터', category: 'electronics', subtype: 'electronics_other', usage: 'sometimes', defect: 'none', route: 'sell' }),
      mk(4, { name: '겨울 패딩', category: 'clothing', usage: 'sometimes', defect: 'none', route: 'consign' }),
      mk(5, { name: '헌옷 한 봉지', category: 'clothing', usage: 'often', defect: 'minor', route: 'pickup', state: 'done', doneAt: U.addDays(today, -1) }),
      mk(6, { name: '전공책 3권', category: 'books', usage: 'sometimes', defect: 'minor', components: 'bodyOnly', trade: 'direct', route: 'give' }),
      mk(7, { name: '책상', category: 'furniture', usage: 'often', defect: 'minor', route: 'dispose' }),
      mk(8, { name: '전기장판', category: 'living', usage: 'sometimes', defect: 'none', route: null })
    ];
    p.tasks = [{ id: 'ex5:apply_pickup', itemId: 'ex5', kind: 'apply_pickup', date: U.addDays(today, -1), done: true, doneAt: U.addDays(today, -1), userEdited: false }];
    p.tasks = S.planner.plan(p, today);
    return p;
  }

  S.store = { KEY, get available() { return available; }, load, save, clearAll, empty, REASONS, reasonOf, newProject, newItem, example };
})(window.S = window.S || {});
