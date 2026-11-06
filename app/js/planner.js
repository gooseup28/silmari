/* 계획 짜기 규칙 — 15번 기획서 8장. 마감에서 거꾸로 세어 할 일과 날짜를 만들어요. */
(function (S) {
  'use strict';
  const U = S.util, C = S.config;

  const START_KIND = { sell: 'post_sale', buyback: 'apply_buyback', consign: 'apply_consign', pickup: 'apply_pickup' };
  const ROUTE_KINDS = {
    sell: ['post_sale', 'drop_price', 'switch_route'],
    buyback: ['apply_buyback', 'send_buyback'],
    consign: ['apply_consign'],
    pickup: ['apply_pickup'],
    give: ['post_give'],
    dispose: ['apply_dispose'],
    keep: []
  };
  const isFinished = it => it.state === 'done' || it.state === 'kept';

  /**
   * 계획을 다시 짜요 (8-5). 끝낸 일과 사용자가 날짜를 바꾼 일은 그대로 둬요.
   * @returns 새 tasks 배열 (project는 바꾸지 않아요)
   */
  function plan(project, today) {
    const items = (project.items || []).slice().sort((a, b) => a.order - b.order);
    const byId = Object.fromEntries(items.map(i => [i.id, i]));
    const old = project.tasks || [];

    // 남길 것: 끝낸 일 + 사용자가 바꾼 일(물건이 아직 그 길이고 끝나지 않았을 때)
    const kept = old.filter(t => {
      if (t.done) return true;
      if (!t.userEdited) return false;
      if (t.kind === 'deadline') return !!project.deadline;
      const it = byId[t.itemId];
      return it && !isFinished(it) && (ROUTE_KINDS[it.route] || []).includes(t.kind);
    });
    if (!project.deadline) return kept.filter(t => t.done);

    const has = (itemId, kind) => kept.some(t => t.itemId === itemId && t.kind === kind);
    const out = kept.slice();
    const daysLeft = U.diffDays(today, project.deadline);
    const short = daysLeft < C.SHORT_DAYS;
    const dl = project.deadline;
    const clamp = d => (d < today ? today : d > dl ? dl : d);
    const D = n => clamp(U.addDays(dl, -n));
    const push = (it, kind, date) => {
      if (it && has(it.id, kind)) return;
      out.push({ id: (it ? it.id : 'project') + ':' + kind, itemId: it ? it.id : null, kind, date, done: false, doneAt: null, userEdited: false });
    };

    // 시작일 칸 세기 (오늘 끝낸 일도 그날 칸을 차지해요 — 하나 끝냈다고 다음 일이 당겨오지 않게)
    const count = {};
    const startKinds = Object.values(START_KIND);
    out.forEach(t => { if (startKinds.includes(t.kind)) { const d = t.done ? (t.doneAt || t.date) : t.date; count[d] = (count[d] || 0) + 1; } });
    const take = d => { count[d] = (count[d] || 0) + 1; return d; };
    function startDate(route) {
      if (short) {
        const tomorrow = U.addDays(today, 1);
        const days = tomorrow <= dl ? [today, tomorrow] : [today];
        for (const d of days) if ((count[d] || 0) < C.PER_DAY) return take(d);
        return take(today);                                          // 넘치면 오늘에 몰아요
      }
      const latest = D(C.LATEST[route]);
      let d = today;
      while ((count[d] || 0) >= C.PER_DAY && d < latest) d = U.addDays(d, 1);
      return take(d > latest ? latest : d);                          // '늦어도' 날짜를 넘지 않게
    }

    for (const it of items) {
      if (!it.route || isFinished(it)) continue;
      const r = it.route;
      if (START_KIND[r] && it.state !== 'doing' && !has(it.id, START_KIND[r])) push(it, START_KIND[r], startDate(r));
      if (r === 'sell') {
        push(it, 'drop_price', short ? clamp(U.addDays(today, Math.floor(daysLeft / 2))) : D(C.DROP_DAY));
        push(it, 'switch_route', short ? D(2) : D(C.SWITCH_DAY));
      }
      if (r === 'buyback' && it.quoteAt) push(it, 'send_buyback', clamp(U.addDays(it.quoteAt, 1)));
      if (r === 'give') push(it, 'post_give', it.giveNow ? clamp(it.giveNow) : D(C.GIVE_DAY));
      if (r === 'dispose') push(it, 'apply_dispose', short ? today : D(C.DISPOSE_DAY));
    }
    if (!kept.some(t => t.kind === 'deadline')) push(null, 'deadline', dl);

    const order = t => (t.kind === 'deadline' ? 1e9 : (byId[t.itemId] || { order: 0 }).order);
    return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : order(a) - order(b)));
  }

  /** 홈의 진행 숫자 */
  function progress(project) {
    const items = project.items || [];
    const finished = items.filter(isFinished).length;
    const routed = items.filter(i => i.route).length;
    return { total: items.length, finished, routed, unrouted: items.filter(i => !i.route) };
  }

  S.planner = { plan, progress, START_KIND, ROUTE_KINDS, isFinished };
})(window.S = window.S || {});
