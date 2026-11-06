/* 길 고르기 규칙 — 15번 기획서 7장. AI는 길을 고르지 않아요. */
(function (S) {
  'use strict';

  const ROUTES = {
    sell:    { label: '직접 팔기',     tasks: 4, chip: 'sell' },
    buyback: { label: '바로 매입',     tasks: 2, chip: 'buyback' },
    consign: { label: '맡기기',        tasks: 2, chip: 'consign' },
    pickup:  { label: '수거',          tasks: 2, chip: 'consign' },
    give:    { label: '나눔',          tasks: 2, chip: 'give' },
    dispose: { label: '버리기',        tasks: 2, chip: 'dispose' },
    keep:    { label: '계속 쓰기',     tasks: 0, chip: 'dispose' }
  };
  const ALL = ['sell', 'buyback', 'consign', 'pickup', 'give', 'dispose'];

  // 7-2 표. '*'가 붙은 버리기는 하자가 '기능 문제'이거나 가구일 때만 보여 줘요.
  const TABLE = {
    device:    { easy: ['buyback', 'sell', 'give'],     more: ['sell', 'buyback', 'give'] },
    elec:      { easy: ['sell', 'give', 'dispose*'],    more: ['sell', 'give', 'dispose*'] },
    clothing:  { easy: ['consign', 'pickup', 'give'],   more: ['sell', 'consign', 'pickup'] },
    books:     { easy: ['give', 'sell'],                more: ['sell', 'give'] },
    furniture: { easy: ['give', 'dispose', 'sell'],     more: ['sell', 'give', 'dispose'] },
    other:     { easy: ['sell', 'give', 'dispose*'],    more: ['sell', 'give', 'dispose*'] }
  };
  // [왜 이 순서일까요?]에 보여 줄 규칙 한 줄
  const GROUP_WHY = {
    device:    { easy: '스마트폰·태블릿·노트북은 바로 매입이 되는 물건이라, 할 일이 적은 매입을 먼저 놓았어요.',
                 more: '스마트폰·태블릿·노트북은 직접 팔면 더 받을 수 있어서 직접 팔기를 먼저, 할 일이 적은 매입을 다음에 놓았어요.' },
    elec:      { easy: '이 전자기기는 바로 매입 품목이 아니라서 직접 팔기를 먼저, 할 일이 적은 나눔을 다음에 놓았어요.',
                 more: '이 전자기기는 바로 매입 품목이 아니라서 직접 팔기를 먼저 놓았어요.' },
    clothing:  { easy: '옷은 담아서 내놓기만 하면 되는 맡기기와 수거가 있어서 먼저 놓았어요.',
                 more: '옷은 직접 팔면 더 받을 수 있어서 직접 팔기를 먼저, 할 일이 적은 맡기기를 다음에 놓았어요.' },
    books:     { easy: '책은 금액이 크지 않은 경우가 많아서, 할 일이 적은 나눔을 먼저 놓았어요.',
                 more: '더 받기를 골라서 직접 팔기를 먼저 놓았어요.' },
    furniture: { easy: '가구·큰 물건은 옮기는 수고가 커서, 가져가 주는 나눔과 버리기를 먼저 놓았어요.',
                 more: '더 받기를 골라서 직접 팔기를 먼저 놓았어요.' },
    other:     { easy: '이 종류는 바로 매입이나 맡기기 서비스가 없어서 직접 팔기를 먼저, 할 일이 적은 나눔을 다음에 놓았어요.',
                 more: '더 받기를 골라서 직접 팔기를 먼저 놓았어요.' }
  };

  function groupOf(it) {
    if (it.category === 'electronics') {
      return ['smartphone', 'tablet', 'laptop'].includes(it.subtype) ? 'device' : 'elec';
    }
    if (it.category === 'clothing' || it.category === 'books' || it.category === 'furniture') return it.category;
    return 'other';
  }
  const isBuybackable = it => groupOf(it) === 'device';

  /**
   * 길 카드 (최대 3장, 첫 장 = 추천)
   * @param it 물건, pref 'easy'|'more', daysLeft 남은 날(마감 없으면 null), priceLow 추천 범위 아래 끝(모르면 null)
   */
  function suggest(it, pref, daysLeft, priceLow) {
    const g = groupOf(it);
    const broken = it.defect === 'broken';
    const why = [];
    let list = TABLE[g][pref === 'more' ? 'more' : 'easy']
      .filter(r => !r.endsWith('*') || broken || g === 'furniture')
      .map(r => r.replace('*', ''));

    why.push(GROUP_WHY[g][pref === 'more' ? 'more' : 'easy']);

    const flags = {};
    const moveToEnd = r => { if (list.includes(r)) list = list.filter(x => x !== r).concat(r); };

    if (broken) {
      moveToEnd('sell');
      list = list.filter(x => x !== 'dispose');
      list.splice(1, 0, 'dispose');
      why.push('기능에 문제가 있어서 직접 팔기를 뒤로, 버리기를 앞으로 옮겼어요.');
      if (list.includes('buyback')) flags.buyback = (flags.buyback || []).concat('고장도 받는지는 그곳에서 확인해요');
    }
    if (daysLeft != null && daysLeft < 7) {
      moveToEnd('sell');
      flags.sell = (flags.sell || []).concat('마감이 가까워요');
      flags.buyback = (flags.buyback || []).concat('시간이 빠듯해요');
      why.push('마감까지 7일이 안 남아서 시간이 오래 걸리는 직접 팔기를 뒤로 보냈어요.');
    }
    if (pref !== 'more' && priceLow != null && priceLow < S.config.SMALL_AMOUNT && list.includes('sell') && list.includes('give')) {
      const si = list.indexOf('sell'), gi = list.indexOf('give');
      if (gi > si) { list.splice(gi, 1); list.splice(si, 0, 'give'); }
      flags.sell = (flags.sell || []).concat('금액이 작아요');
      why.push('추천 가격이 1만 원보다 작아서 나눔을 직접 팔기 앞으로 옮겼어요.');
    }
    return { routes: list.slice(0, 3), flags, why: why.join(' ') };
  }

  S.routes = { ROUTES, ALL, TABLE, groupOf, isBuybackable, suggest };
})(window.S = window.S || {});
