/* 가격 규칙 — 13번 기획서 9장 그대로 (가구·큰 물건 0.6만 A안에서 추가)
   AI는 이 계산에 끼어들지 않아요. */
(function (S) {
  'use strict';

  // ---- 값 이름 (저장용 키) ----
  const CATEGORIES = [
    { key: 'electronics', label: '전자기기' },
    { key: 'clothing',    label: '의류·신발·잡화' },
    { key: 'books',       label: '도서·교재' },
    { key: 'furniture',   label: '가구·큰 물건' },
    { key: 'living',      label: '생활·주방' },
    { key: 'sports',      label: '운동·레저' },
    { key: 'etc',         label: '기타' }
  ];
  const SUBTYPES = [
    { key: 'smartphone',        label: '스마트폰' },
    { key: 'tablet',            label: '태블릿' },
    { key: 'laptop',            label: '노트북' },
    { key: 'electronics_other', label: '기타 전자기기' }
  ];
  const AGES = [
    { key: 'lt6m', label: '6개월 이내', text: '6개월이 안 됐어요' },
    { key: '6m1y', label: '6개월~1년', text: '약 6개월~1년 전' },
    { key: '1y2y', label: '1~2년',     text: '약 1~2년 전' },
    { key: '2y3y', label: '2~3년',     text: '약 2~3년 전' },
    { key: 'gt3y', label: '3년 이상',  text: '3년 이상 됐어요' }
  ];
  const COMPONENTS = [
    { key: 'full',     label: '박스까지 전부' },
    { key: 'partial',  label: '일부 구성품' },
    { key: 'bodyOnly', label: '본품만' }
  ];
  const TRADES = [
    { key: 'direct',   label: '직거래' },
    { key: 'delivery', label: '택배' },
    { key: 'both',     label: '직거래·택배 둘 다' }
  ];
  const BATTERY = [
    { key: 'ge90',    label: '90% 이상' },
    { key: '80to89',  label: '80~89%' },
    { key: 'lt80',    label: '80% 미만' },
    { key: 'unknown', label: '잘 모르겠어요' }
  ];
  const USAGE_KEYS = ['likeNew', 'sometimes', 'often'];
  const DEFECT_KEYS = ['none', 'minor', 'visible', 'broken'];

  // 종류별 질문 이름 (9-3). 비율은 같고 이름만 달라요.
  const NAMES = {
    electronics: { usage: ['거의 새것', '가끔 사용', '자주 사용'], defect: ['없음', '생활 기스 정도', '눈에 띄는 흠', '기능에 문제 있음'] },
    clothing:    { usage: ['거의 안 입음', '가끔 입음', '자주 입음'], defect: ['없음', '약간의 사용감', '눈에 띄는 오염·늘어남', '찢어짐·고장(지퍼 등)'] },
    books:       { usage: ['거의 안 봄', '가끔 봄', '많이 봄'], defect: ['깨끗함', '약간의 사용감', '필기·밑줄 있음', '찢어짐·빠진 쪽'] },
    other:       { usage: ['거의 새것', '가끔 사용', '자주 사용'], defect: ['없음', '생활 기스 정도', '눈에 띄는 흠', '기능에 문제 있음'] }
  };
  const namesFor = cat => NAMES[cat] || NAMES.other;
  const usageLabel = (cat, k) => namesFor(cat).usage[USAGE_KEYS.indexOf(k)] || '';
  const defectLabel = (cat, k) => namesFor(cat).defect[DEFECT_KEYS.indexOf(k)] || '';

  // ---- 비율 (9-2) ----
  const R = {
    age:   { lt6m: .75, '6m1y': .65, '1y2y': .5, '2y3y': .4, gt3y: .3 },
    cat:   { electronics: .9, clothing: .6, books: .5, living: .8, sports: .8, etc: .75, furniture: .6 },
    usage: { likeNew: 1.1, sometimes: 1, often: .85 },
    defect:{ none: 1, minor: .9, visible: .75, broken: .5 },
    comp:  { full: 1.05, partial: 1, bodyOnly: .95 },
    battery: { ge90: 1, '80to89': .9, lt80: .75, unknown: .9 }
  };

  const labelOf = (list, k) => (list.find(x => x.key === k) || {}).label || '';
  const round1000 = n => Math.max(1000, Math.round(n / 1000) * 1000);   // .5는 올림
  const won = n => Number(n).toLocaleString('ko-KR') + '원';
  const toInt = s => { const n = parseInt(String(s == null ? '' : s).replace(/[^0-9]/g, ''), 10); return n > 0 ? n : 0; };
  const pct = r => Math.round(r * 100) + '%';

  /** 가격을 계산할 수 있는지 (필요한 답이 다 있는지) */
  function canPrice(it) {
    return toInt(it.purchasePrice) > 0 && R.age[it.ageBucket] != null && R.cat[it.category] != null &&
      R.usage[it.usage] != null && R.defect[it.defect] != null && R.comp[it.components] != null;
  }

  /** 9-1 계산식. 단계(steps)를 차례로 곱하면 mid가 돼요. */
  function calc(it) {
    if (!canPrice(it)) return null;
    const p = toInt(it.purchasePrice);
    const steps = [
      { label: '산 지 ' + labelOf(AGES, it.ageBucket), ratio: R.age[it.ageBucket] },
      { label: labelOf(CATEGORIES, it.category), ratio: R.cat[it.category] },
      { label: usageLabel(it.category, it.usage), ratio: R.usage[it.usage] },
      { label: it.defect === 'none' && it.category !== 'books' ? '흠 없음' : defectLabel(it.category, it.defect), ratio: R.defect[it.defect] },
      { label: labelOf(COMPONENTS, it.components), ratio: R.comp[it.components] }
    ];
    if (it.hasBattery && R.battery[it.battery] != null) {
      steps.push({ label: '배터리 ' + labelOf(BATTERY, it.battery), ratio: R.battery[it.battery] });
    }
    const mid = steps.reduce((acc, s) => acc * s.ratio, p);
    const low = round1000(mid * .9), high = round1000(mid * 1.1);
    return { purchase: p, steps, mid, midRounded: round1000(mid), low, high, start: round1000((low + high) / 2) };
  }

  /** 9-6 시세 가운데 값: 1개면 그 값, 2개면 평균, 3개면 가운데 값 */
  function marketMid(prices) {
    const xs = (prices || []).map(toInt).filter(x => x > 0).sort((a, b) => a - b);
    if (!xs.length) return null;
    if (xs.length === 1) return xs[0];
    if (xs.length === 2) return (xs[0] + xs[1]) / 2;
    return xs[1];
  }

  /** 9-6 비교 문장. 추천 범위와 올릴 가격은 절대 바꾸지 않아요. */
  function compare(prices, low, high) {
    const xs = (prices || []).map(toInt).filter(x => x > 0);
    if (!xs.length) return null;
    const m = marketMid(xs);
    let kind, text;
    if (m < low) { kind = 'below'; text = '시세가 추천보다 낮아요. 빨리 팔고 싶다면 시세 쪽으로 내려도 돼요.'; }
    else if (m > high) { kind = 'above'; text = '시세가 추천보다 높아요. 상태가 좋거나 구성품이 많다면 시세 쪽으로 올려도 돼요.'; }
    else { kind = 'within'; text = '시세와 추천이 비슷해요. 이 범위에서 정하면 돼요.'; }
    const extra = [];
    if (xs.length === 1) extra.push('시세가 1개뿐이라 참고로만 봐요.');
    if (xs.length > 1 && Math.max(...xs) >= Math.min(...xs) * 2) extra.push('적은 시세끼리 차이가 커요. 같은 모델·비슷한 상태인지 다시 확인해 보세요.');
    return { kind, mid: m, text, extra };
  }

  /** 9-7 가격 내려 보기 제안 */
  function dropSuggestion(current, low, prices) {
    const cur = toInt(current);
    const xs = (prices || []).map(toInt).filter(x => x > 0);
    const cands = [low, xs.length ? Math.min(...xs) : null].filter(x => x != null && x < cur);
    if (cands.length) return Math.max(...cands);
    return round1000(cur * .95);
  }

  S.price = { CATEGORIES, SUBTYPES, AGES, COMPONENTS, TRADES, BATTERY, USAGE_KEYS, DEFECT_KEYS, R,
    namesFor, usageLabel, defectLabel, labelOf, round1000, won, toInt, pct,
    canPrice, calc, marketMid, compare, dropSuggestion };
})(window.S = window.S || {});
