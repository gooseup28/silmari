# 실마리 (silmari)

정리 마감(이사·전역·졸업·합가)이 있을 때, 물건마다 가장 덜 귀찮은 길(직접 팔기 · 바로 매입 · 맡기기 · 수거 · 나눔 · 버리기)을 찾고, 마감에서 거꾸로 계획을 짜 주는 정리 비서예요.

- `index.html` — 실마리 소개 페이지
- `app/` — 실마리 앱 (HTML · CSS · JavaScript, 빌드 없음)
- `app/tests.html` — 가격·길·계획 규칙 시험

## 데이터
- 로그인 없음. 정리 목록은 쓰는 사람의 브라우저(localStorage)에만 저장돼요.
- 바깥으로 보내는 요청이 없어요(Content-Security-Policy로 막아 둠). 통계·추적 도구도 없어요.
- 가격은 정해진 규칙으로만 계산해요. AI나 다른 사이트의 시세를 쓰지 않아요.

## 글꼴
Noto Sans KR (SIL Open Font License 1.1, `app/fonts/OFL.txt`) — 자주 쓰는 글자만 남겨 함께 올렸어요.
