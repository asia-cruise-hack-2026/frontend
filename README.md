# 11.jeju_cruise — 제주 관광 데이터 소스 컨텍스트

기획·아이데이션 핑퐁에 앞서, 공개 데이터/콘텐츠를 정찰·카탈로그화하여
이후 핑퐁 중 **Notion MCP로 근거 데이터를 즉시 참조**하기 위한 저장소.

## 구조
- **docs/superpowers/specs/** — 설계 문서(spec)
- **docs/recon/** — 사이트별 정찰 노트 (재현 가능한 API·취득법 포함)
  - `00-catalog-blueprint.md` — Notion 카탈로그 DB 적재용 청사진(행 단위)
  - `01-bigdata-platform.md` — data.ijto.or.kr (통계 지표)
  - `02-visitjeju.md` — visitjeju.net (관광 콘텐츠 POI)
  - `03-ijto-org.md` — ijto.or.kr (정책·홍보·신청)
- **data/** — 캡처한 실데이터 원본 샘플(재현·갱신용)

## 세 데이터 소스 요약
| 소스 | 성격 | 핵심 취득법 | 인증 |
|---|---|---|---|
| data.ijto.or.kr (빅데이터플랫폼) | 관광 통계 지표(입도·크루즈·소비·교통·관광지·설문) | `POST /api/dataPick/chart/renderChart.do` (regSn별) | 익명 |
| visitjeju.net (비짓제주) | 관광 콘텐츠 DB(관광지/음식/숙박/쇼핑/축제/테마 ~5,838건) | `GET api.visitjeju.net/api/contents/list` (contentscd별) | 익명 |
| ijto.or.kr (관광공사) | 정책·보도자료·공공데이터 신청 | 게시판 `Bd/list.php` / 신청 cid=138 | 익명(신청 별도) |

## MCP (.mcp.json)
- **notion** — 컨텍스트를 노션에 구성·핑퐁 참조 (호스티드, OAuth). `/mcp`로 승인 필요.
- **chrome-devtools** — JS 렌더링 사이트 정찰용(네트워크 캡처).

## 진행 상태
- [x] 3개 사이트 정찰 완료 (익명 JSON API·게시판 구조·실데이터 스냅샷 확보)
- [x] Notion 적재 완료 — 최상위 페이지(개요/사용법) + 「데이터 소스 카탈로그」 DB(36행: 빅데이터 25·비짓제주 8·관광공사 3)

## Notion
- **페이지**: [제주 관광 데이터 소스 컨텍스트](https://app.notion.com/p/3a40068a1c0a81f28cf5d5e8e064f00f)
- **카탈로그 DB**: https://app.notion.com/p/b43f1437455140bd9805b806ece05992
- **data source id**: `4ceed401-9a4f-41d3-8351-90cde4a1a24a` (Notion MCP 질의용)
- 스키마: `이름 · 사이트 · 데이터유형 · 활용각도 · 취득방법 · 갱신주기 · 인증필요 · 원본링크` + 행 본문에 실데이터 스냅샷
- 핑퐁 활용: 이데이션 중 이 DB를 Notion MCP로 필터/조회해 근거 데이터를 끌어옴
