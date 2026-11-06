/* 사용자가 확정한 설계 값 (2026-11-06, 기획서 19장 '제안 값 그대로')
   바꾸고 싶으면 여기 한 곳만 고치면 돼요. */
(function (S) {
  'use strict';
  S.config = {
    LATEST: { sell: 10, buyback: 10, consign: 14, pickup: 7 },  // '늦어도' D-n
    DISPOSE_DAY: 7,          // 버리기 신청 D-7
    GIVE_DAY: 4,             // 나눔 글 D-4
    DROP_DAY: 7,             // 가격 내리기 D-7
    SWITCH_DAY: 4,           // 나눔·매입으로 바꾸기 D-4
    PER_DAY: 2,              // 하루에 새로 시작하는 일
    SHORT_DAYS: 10,          // 남은 날 10일 미만이면 '마감이 짧아요'
    SMALL_AMOUNT: 10000,     // '금액이 작아요' 기준
    LINKS_CHECKED: '2026-11-06'
  };

  // ---- 날짜 (모두 '현지 날짜' YYYY-MM-DD 문자열로 다뤄요) ----
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = fromISO(s); d.setDate(d.getDate() + n); return toISO(d); };
  const diffDays = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);   // b - a
  const todayISO = () => toISO(new Date());
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const fmtMD = s => { const d = fromISO(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
  const fmtShort = s => { const d = fromISO(s); return `${d.getMonth() + 1}/${d.getDate()}`; };

  // ---- 조사 (받침에 따라 을/를, 이/가, 은/는, 으로/로) ----
  function hasBatchim(word) {
    const ch = String(word).trim().slice(-1);
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return /[0-9]$/.test(ch) ? '013678'.includes(ch) : false;
    return code % 28 !== 0;
  }
  function rieul(word) { const c = String(word).trim().slice(-1).charCodeAt(0) - 0xAC00; return c >= 0 && c % 28 === 8; }
  const josa = {
    eul: w => w + (hasBatchim(w) ? '을' : '를'),
    i: w => w + (hasBatchim(w) ? '이' : '가'),
    eun: w => w + (hasBatchim(w) ? '은' : '는'),
    ro: w => w + (hasBatchim(w) && !rieul(w) ? '으로' : '로')
  };

  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  S.util = { toISO, fromISO, addDays, diffDays, todayISO, fmtMD, fmtShort, josa, uid };
})(window.S = window.S || {});
