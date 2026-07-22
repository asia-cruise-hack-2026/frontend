# 디자인 핸드오프 (frontend)

프론트 UI 구현의 디자인 소스는 **Figma가 아니라** 디자이너가 전달하는 **zip 파일 + standalone HTML**이다.
이 파일들은 **Claude design** 산출물을 `share` 로 추출한 것이며, 앞으로의 프론트 디자인 구현은 이 내용을 기준으로 한다.

## 받는 곳
- 전달받은 zip / standalone HTML 을 **`design/incoming/`** 에 넣는다 (예: `design/incoming/2026-07-23-home.zip`, `design/incoming/home.html`).
- 원본 zip 을 그대로 두거나 같은 폴더에 풀어도 된다.

## 구현으로 옮기는 법
1. `incoming/` 의 HTML·에셋을 **레이아웃·플로우·스펙의 근거**로 읽는다(추측 금지 — core-rules).
2. 스타일을 그대로 베끼지 않고 **원티드 Montage(WDS) 컴포넌트/토큰으로 매핑**한다(`montage-react` 스킬 + Montage MCP). 색·간격·타이포는 `theme.semantic.*`.
3. 모바일 뷰포트 기준(→ `mobile-webview` 스킬), 앱처럼.

> `incoming/` 의 파일은 **참고 원본**이다. 최종 구현은 `src/` 의 Montage 기반 컴포넌트다.
> zip 이 크거나 바이너리가 많으면 추적 제외를 검토한다(현재는 팀 공유 위해 커밋).
