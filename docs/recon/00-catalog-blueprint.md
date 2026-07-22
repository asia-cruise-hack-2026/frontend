# 카탈로그 청사진 — Notion 「데이터 소스 카탈로그」 적재용

- **작성일**: 2026-07-21 (정찰 기반)
- **용도**: Notion MCP 승인 후, 아래 각 행을 「데이터 소스 카탈로그」 DB의 레코드로 적재. 스키마 = `이름 · 사이트 · 데이터유형 · 활용각도 · 취득방법 · 갱신주기 · 인증필요 · 원본링크`.
- **사이트 select 값**: `빅데이터플랫폼`(data.ijto.or.kr) · `비짓제주`(visitjeju.net) · `관광공사`(ijto.or.kr)
- **데이터유형 multi-select 값**: `통계지표` · `POI` · `보고서` · `트렌드` · `설문` · `게시판/뉴스` · `API`

---

## A. 빅데이터플랫폼 (data.ijto.or.kr) — 통계 지표

> 공통 취득 API: `POST /api/dataPick/chart/renderChart.do`, body `{"regSn":N,"chartIndex":0,"searchDataBgnDt":"","searchDataEndDt":""}`, 헤더 `content-type: application/json` + `x-requested-with: XMLHttpRequest`. 인증 불필요. 상세표/메타는 `sub02/view.do?regSn=N`. 라이선스: 다수 공공누리 제1유형.

| 이름 | 데이터유형 | 활용각도 | 취득방법(regSn) | 갱신주기 | 인증 | 링크 |
|---|---|---|---|---|---|---|
| 크루즈 입도객(월별) | 통계지표·API | 크루즈 수요 시즌성·선박별 규모·전년비 회복 | renderChart regSn=59 / view.do?regSn=59 | 매주 | 불필요 | .../sub02/view.do?regSn=59 |
| 크루즈 입도객(일별) | 통계지표·API | 일 단위 기항 피크, 누적 추이 | regSn=73 | 매주 | 불필요 | .../view.do?regSn=73 |
| 크루즈관광객 세부 만족도 | 설문 | 출입국·동선·쇼핑 등 페인포인트 | regSn=88 | 부정기 | 불필요 | .../view.do?regSn=88 |
| 제주방문 관광객 일일통계 | 통계지표·API | 내/외국인 일일 입도객, 전일·전주·전월비 | regSn=18 | 일 | 불필요 | .../view.do?regSn=18 |
| 입도 관광객 추이(연도별) | 통계지표·API | 국내/국외 장기 추세(2017~) | regSn=70 | 연/월 | 불필요 | .../view.do?regSn=70 |
| 방문 형태별 내국인 입도객 | 통계지표·API | 개별/단체 등 여행형태 세그먼트 | regSn=40 | 월 | 불필요 | .../view.do?regSn=40 |
| 관광객 거주지 분포(시군구) | 통계지표·API | 출발지 타깃(수도권 등) 마케팅 | regSn=67 | 월 | 불필요 | .../view.do?regSn=67 |
| 카드 소비금액 추이 | 통계지표·API | 관광객/도민 소비 규모·구성 | regSn=35 | 월 | 불필요 | .../view.do?regSn=35 |
| 국가별 외국인 소비 | 통계지표·API | 국적별 지출(면세·쇼핑 기획) | regSn=60 | 월 | 불필요 | .../view.do?regSn=60 |
| 음식점업 업종별 소비 현황 | 통계지표·API | F&B 업종별 소비, 외식 수요 | regSn=82 | 월 | 불필요 | .../view.do?regSn=82 |
| 월별 항공 운항·여객 추이 | 통계지표·API | 교통 공급/수요, 접근성 | regSn=50 | 월 | 불필요 | .../view.do?regSn=50 |
| 제주 차량 도착 수 비교 | 통계지표·API | 렌터카/차량 이동량 | regSn=46 | 월 | 불필요 | .../view.do?regSn=46 |
| 전세버스 가동률 | 통계지표·API | 단체관광 활동성 | regSn=56 | 월 | 불필요 | .../view.do?regSn=56 |
| 지역별 관광객 도착 수 | 통계지표·API | 읍면동 동선·수요 집중지 | regSn=51 | 월 | 불필요 | .../view.do?regSn=51 |
| 지역별 관광지 도착 | 통계지표·API | 관광지 단위 방문량 | regSn=48 | 월 | 불필요 | .../view.do?regSn=48 |
| 한라산 탐방객 | 통계지표·API | 대표 관광지 수요·시즌성 | regSn=53 | 월 | 불필요 | .../view.do?regSn=53 |
| 골프장 내장객 | 통계지표·API | 골프 관광 수요 | regSn=54 | 월 | 불필요 | .../view.do?regSn=54 |
| 섬 속의 섬 방문객(우도 등) | 통계지표·API | 부속 섬 관광 수요 | regSn=57 | 월 | 불필요 | .../view.do?regSn=57 |
| 이동통신 지역 방문(읍면동) | 통계지표·API | 유동인구 기반 상권/동선 | regSn=21 | 월 | 불필요 | .../view.do?regSn=21 |
| 제주여행 전반 만족도 설문 | 설문 | 전반 만족·재방문 의향 | regSn=85 | 연 | 불필요 | .../view.do?regSn=85 |
| 외국인관광객 세부 만족도 | 설문 | 외국인 페인포인트 | regSn=87 | 부정기 | 불필요 | .../view.do?regSn=87 |
| 비짓제주 검색어 순위 | 트렌드·API | 실검 기반 관심 스팟 | regSn=22 | 월 | 불필요 | .../view.do?regSn=22 |
| 자료실(보고서) | 보고서 | 관광시장 동향(월)·실태조사·크루즈 분석 등 | rpstr/sub04_01/view.do?regSn=N (clsf 01~09) | 월/부정기 | 불필요 | .../sub04_01/list.do |
| 트렌드 리포트 | 트렌드·보고서 | 렌터카·외식물가·차량이동·크루즈안내소 등 분석 아티클 | trndRprt/sub03/view.do?regSn=N | 부정기 | 불필요 | .../sub03/list.do |
| 데이터맵 제주 | 통계지표 | 공간(지도) 단위 데이터 | /bigdata/sub01.do | - | 불필요 | .../sub01.do |

---

## B. 비짓제주 (visitjeju.net) — 관광 콘텐츠 DB(POI)

> 공통 취득 API: `GET https://api.visitjeju.net/api/contents/list?_siteId=jejuavj&locale=kr&contentscd={cd}&region1cd=&region2cd=&tag=&q=&sorting=markcnt desc, title_kr asc&pageSize=&page=`. 익명(iceJWT 자동). 항목에 좌표·주소·태그·3단계분류·인기지표·대표사진 포함.

| 이름 | 데이터유형 | 활용각도 | 취득방법(contentscd) | 갱신주기 | 인증 | 링크 |
|---|---|---|---|---|---|---|
| 관광지 (1,340) | POI·API | 코스/추천/지도, 인기(markcnt) 랭킹 | contentscd=c1 | 상시 | 불필요 | api.visitjeju.net/api/contents/list |
| 음식점 (1,864) | POI·API | 맛집 추천, F&B 동선 | c4 | 상시 | 불필요 | 〃 |
| 숙박 (915) | POI·API | 숙소 추천/예약 연계 | c3 | 상시 | 불필요 | 〃 |
| 쇼핑 (262) | POI·API | 쇼핑/면세 동선 | c2 | 상시 | 불필요 | 〃 |
| 축제/행사 (709) | POI·게시판 | 시즌 기획, 일정·지역 연계 | c5 | 상시 | 불필요 | 〃 |
| 테마여행 (745) | POI·트렌드 | 웰니스·그린 등 테마 큐레이션 | c6 | 상시 | 불필요 | 〃 |
| 태그/검색 필터 | API | 웰니스·무장애·반려동물·크루즈 등 세그먼트/키워드 매칭 | tag=, q= 파라미터 | 상시 | 불필요 | 〃 |
| 다국어 콘텐츠 | POI·API | 외국인(en/jp/cn) 대상 동일 콘텐츠 | locale= 파라미터 | 상시 | 불필요 | 〃 |

---

## C. 제주관광공사 (ijto.or.kr) — 정책·홍보·신청

| 이름 | 데이터유형 | 활용각도 | 취득방법 | 갱신주기 | 인증 | 링크 |
|---|---|---|---|---|---|---|
| 보도자료 | 게시판/뉴스 | 공사 전략(AI·MICE·ESG·반려동물·외국인쇼핑) 신호, 행사/캠페인 연계 | Bd/list.php?btable=report_info (view.php?bno=N) | 상시 | 불필요 | ijto.or.kr/korean/Bd/list.php?btable=report_info |
| 공공데이터 신청 | API·보고서 | 대량/안정 데이터 정식 확보 경로(익명 스크래핑 백업) | 신청 양식 cid=138/246 | - | 신청필요 | ijto.or.kr/korean/index.php?cid=138 |
| 정보공개/경영공시 | 보고서 | 예산·사업계획 등 거버넌스 맥락 | 정보공개 메뉴 | 부정기 | 불필요 | ijto.or.kr/korean/beforeList/ |

---

## 인덱스 페이지에 넣을 "핑퐁 사용 가이드" 초안
- 아이디어가 나오면 → 카탈로그 DB에서 **데이터유형/사이트/키워드**로 필터 → 관련 지표/POI 행의 `취득방법`으로 실데이터 재현 → 근거로 첨부.
- 예: "크루즈 승객 대상 당일 동선 앱" → (빅데이터)크루즈 입도객 월별/일별·크루즈 만족도 + (비짓제주)q=크루즈·강정크루즈여객터미널·인근 관광지 c1 + (공사)크루즈/MICE 보도자료.
