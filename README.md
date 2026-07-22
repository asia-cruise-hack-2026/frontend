# 11.jeju_cruise — 아시아 크루즈 해커톤 프론트엔드

제주 크루즈 관광 웹앱 (repo: `asia-cruise-hack-2026/frontend`).
**주 스택은 웹**, 단 **발표 시연에서는 앱처럼** 보이게 만든다 (모바일 퍼스트 · 풀스크린 지도 ·
바텀시트 · PWA). 핵심 플로우: 지도 마커 확인·수집 → 경로 생성 → 택시앱 같은 UX → 네비.

> 에이전트 작업 규칙·소스 라우팅·절대 원칙은 **[`CLAUDE.md`](./CLAUDE.md)** 참고.

## 작업 방식 (소스 오브 트루스)
| 종류 | 소스 | 도구 |
|---|---|---|
| 기획 · 정책 | Notion 지정 페이지 (⏳ 작성 대기) | Notion MCP |
| 참조 · 근거 데이터 | Notion 「데이터 소스 카탈로그」 DB | Notion MCP |
| 디자인 | Figma 지정 파일 (⏳ 경로 대기) | Figma MCP |
| 서버 API 계약 | `refs/server/` (서버 레포 클론, 읽기 전용) | Read |

**클라이언트는 모든 기능이 동작하는 것처럼 보여야 한다** — 서버 범위 미합의이므로 데이터 접근은
mock 어댑터 레이어를 통과시키고, 서버 의존 기능은 시뮬레이션으로 채운다.

## 디렉토리
- `src/` — 클라이언트 앱 (스캐폴딩 예정)
- `refs/server/` — 서버 레포 클론 (gitignore, 읽기 전용)
- `docs/recon/` — 데이터 소스 정찰 노트 · `docs/superpowers/specs/` — 설계 문서
- `data/` — 캡처한 실데이터 원본 샘플

---

## 부록: 제주 관광 데이터 소스 컨텍스트 (정찰 완료본)

기획·아이데이션에 앞서 공개 데이터/콘텐츠를 정찰·카탈로그화해 둔 결과.
핑퐁 중 **Notion MCP로 근거 데이터를 즉시 참조**하기 위한 자산이다.

### 세 데이터 소스 요약
| 소스 | 성격 | 핵심 취득법 | 인증 |
|---|---|---|---|
| data.ijto.or.kr (빅데이터플랫폼) | 관광 통계 지표(입도·크루즈·소비·교통·관광지·설문) | `POST /api/dataPick/chart/renderChart.do` (regSn별) | 익명 |
| visitjeju.net (비짓제주) | 관광 콘텐츠 DB(관광지/음식/숙박/쇼핑/축제/테마 ~5,838건) | `GET api.visitjeju.net/api/contents/list` (contentscd별) | 익명 |
| ijto.or.kr (관광공사) | 정책·보도자료·공공데이터 신청 | 게시판 `Bd/list.php` / 신청 cid=138 | 익명(신청 별도) |

### Notion 카탈로그
- **페이지**: [제주 관광 데이터 소스 컨텍스트](https://app.notion.com/p/3a40068a1c0a81f28cf5d5e8e064f00f)
- **카탈로그 DB**: https://app.notion.com/p/b43f1437455140bd9805b806ece05992
- **data source id**: `4ceed401-9a4f-41d3-8351-90cde4a1a24a` (Notion MCP 질의용)
- 스키마: `이름 · 사이트 · 데이터유형 · 활용각도 · 취득방법 · 갱신주기 · 인증필요 · 원본링크` + 행 본문에 실데이터 스냅샷
- 적재 완료: 카탈로그 DB 36행 (빅데이터 25 · 비짓제주 8 · 관광공사 3)

정찰 노트 원본은 `docs/recon/` (`00-catalog-blueprint` · `01-bigdata-platform` ·
`02-visitjeju` · `03-ijto-org`), 실데이터 샘플은 `data/`.

## MCP (.mcp.json)
- **notion** — 컨텍스트 구성·핑퐁 참조 (호스티드, OAuth). `/mcp`로 승인 필요.
- **chrome-devtools** — JS 렌더링 사이트 정찰용(네트워크 캡처).
- **montage-mcp-server** — 원티드 Montage 컴포넌트·토큰·아이콘·더미 스캐폴드 조회 (호스티드 http). `/mcp`로 연결.
- **figma** — 디자인 참조 (figma 플러그인, 인증 필요).
