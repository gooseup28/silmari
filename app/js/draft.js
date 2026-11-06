/* 글 규칙 — 13번 10-1 판매글 틀, 15번 10장 나눔 글 틀. 연락처·주소·실명은 넣지 않아요. */
(function (S) {
  'use strict';
  const P = S.price;

  function conditionLine(it) {
    if (it.defect === 'none' || !it.defect) return '눈에 띄는 흠이나 고장은 없어요.';
    const name = P.defectLabel(it.category, it.defect);
    const note = (it.defectNote || '').trim();
    return `${name}${note ? '(' + note + ')' : ''}. 사진으로도 확인해 주세요.`;
  }
  const priceLine = price => `가격은 ${P.won(P.toInt(price))}이에요.`;
  const PRICE_LINE_RE = /가격은 [0-9,]+원이에요\./;

  function sale(it) {
    const model = (it.model || '').trim();
    const usage = P.usageLabel(it.category, it.usage);
    const title = `${it.name}${model ? ' ' + model : ''} 판매해요 (${usage})`;
    const age = (P.AGES.find(a => a.key === it.ageBucket) || {}).text || '';
    const lines = [
      `${it.name} 정리하려고 내놓아요.`,
      '',
      `· 구매 시기: ${age}`,
      `· 사용 정도: ${usage}`,
      `· 상태: ${conditionLine(it)}`
    ];
    if (it.hasBattery && it.battery) lines.push(`· 배터리: ${P.labelOf(P.BATTERY, it.battery)}`);
    lines.push(`· 구성품: ${P.labelOf(P.COMPONENTS, it.components)}`);
    lines.push(`· 거래: ${P.labelOf(P.TRADES, it.trade)}`);
    lines.push('', priceLine(it.finalPrice), '궁금한 점은 편하게 물어봐 주세요!');
    return { title, body: lines.join('\n') };
  }

  function give(it) {
    const lines = [`${it.name} 정리하면서 나눔해요.`, '', `· 상태: ${conditionLine(it)}`];
    if (it.components) lines.push(`· 구성품: ${P.labelOf(P.COMPONENTS, it.components)}`);
    lines.push(`· 받는 방법: ${P.labelOf(P.TRADES, it.trade || 'direct')}`, '', '필요하신 분 편하게 연락 주세요!');
    return { title: `${it.name} 나눔해요`, body: lines.join('\n') };
  }

  /** 가격을 바꾸면 글 속 가격 줄도 바꿔요 (그 줄을 지우지 않았을 때) */
  const replacePrice = (body, price) => body.replace(PRICE_LINE_RE, priceLine(price));

  S.draft = { sale, give, conditionLine, replacePrice, PRICE_LINE_RE };
})(window.S = window.S || {});
