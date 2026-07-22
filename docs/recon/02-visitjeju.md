# 정찰 노트 ② — 비짓제주 (visitjeju.net)

- **정찰일**: 2026-07-21 (chrome-devtools MCP)
- **성격**: 제주도 공식 관광정보 포털(제주관광공사 운영). 관광 콘텐츠 DB(POI) + 축제/행사 + 콘텐츠(뉴스/테마).
- **핵심 발견**: 프런트(www.visitjeju.net)는 백엔드 **공개 JSON API(api.visitjeju.net)** 를 호출. 익명 접근 가능.

## 1. 콘텐츠 목록 API ★핵심 재현법

```
GET https://api.visitjeju.net/api/contents/list
  ?_siteId=jejuavj        (필수)
  &locale=kr              (kr/en/jp/cn 등 다국어)
  &device=pc
  &contentscd=c1          (카테고리 필터 — 아래 표)
  &region1cd=&region2cd=  (지역 필터)
  &tag=                   (태그 필터: 웰니스, 무장애관광, 반려동물 …)
  &q=                     (검색어 — 교차 카테고리)
  &sorting=markcnt desc, title_kr asc   (인기순 등)
  &pageSize=12&page=1
Headers: accept: application/json ; (Origin/Referer: https://www.visitjeju.net)
```
- **인증**: 익명. iceJWT 쿠키(sub=Anonymous) 자동발급. 로그인 불필요.
- **CORS**: `access-control-allow-origin: https://www.visitjeju.net` — 외부 직접 호출 시 Origin/Referer 헤더 또는 브라우저 컨텍스트 필요.
- **응답**: `{result, totalCount, pageCount, currentPage, resultCount, items:[...]}`

### contentscd (카테고리) 맵 — 확정
| 코드 | 분류 | 총 건수 |
|---|---|---|
| c1 | 관광지 | 1,340 |
| c2 | 쇼핑 | 262 |
| c3 | 숙박 | 915 |
| c4 | 음식점 | 1,864 |
| c5 | 축제/행사 | 709 |
| c6 | 테마여행 | 745 |
| c7 | 정보 | 2 |
| — | (전체, 필터 없음) | 5,838 |

### 항목(item) 주요 필드
- 식별/분류: `contentsid`, `contentscd`, `catemappList`(3단계 분류 cate1>cate2>cate3, 예: 관광지>자연>오름)
- 위치: `region1cd`(시), `region2cd`(읍면동), `address`, `roadaddress`, **`latitude`/`longitude`**
- 설명/태그: `title`, `introduction`(요약), `sbst`(상세 본문), `tag`, `alltag`
- **인기·참여 지표**: `readcnt`(조회), `likecnt`, `reviewcnt`, **`markcnt`(북마크=인기 랭킹 기준)**, `snssharecnt`, `visitcnt`
- 미디어/부가: `repPhoto`(대표사진 CDN webp), `phoneno`, `reservelink`(예약)

## 2. 상세/기타
- 상세 페이지(웹): `/kr/{type}/view?contentsid=CNTS_...` (type: festival, themtour, bbs 등)
- 상세 데이터도 동일 API 계열로 조회 가능(list 항목에 이미 sbst 상세설명 포함).
- 태그 필터 예: `tag=웰니스`(42건), `무장애관광`, `반려동물동반입장` 등 → 테마·타깃 세그먼트에 유용.

## 3. 실데이터 스냅샷 (원본: `data/visitjeju_contents_sample.json`)
- 관광지 인기순 Top: 성산일출봉(markcnt 4,972), 사려니숲길(3,998), 카멜리아힐(3,983)
- **크루즈 검색(q=크루즈)**: 강정크루즈여객터미널(관광지), 제13회 제주국제크루즈포럼(축제), 2025 서귀포 크루즈 페스타(축제)

## 4. 활용 각도 (이데이션 참조)
- **POI 소싱**: 관광지/음식/숙박/쇼핑 5,800여 건을 좌표·카테고리·인기지표와 함께 확보 → 코스·추천·지도 서비스 재료.
- **인기 랭킹**: `markcnt`/`readcnt` 정렬로 실제 인기 스팟 도출(데이터 기반 큐레이션).
- **테마·타깃**: `tag` 필터로 웰니스·무장애·반려동물·포토스팟 등 세그먼트 콘텐츠 구성.
- **다국어**: `locale`로 외국인 대상(en/jp/cn) 콘텐츠 동시 확보 — 크루즈 외국인 관광객 대응.
- **크루즈 연계**: q=크루즈, 강정크루즈여객터미널 등 항만·크루즈 관련 POI/행사 직접 매칭.
- **행사 캘린더**: 축제/행사(c5)에 기간·지역 포함 → 시즌 기획·일정 연계.

## 5. 주의/위험
- CORS가 visitjeju.net 오리진으로 제한 → 서버 재현 시 Origin/Referer 세팅 또는 세션 필요.
- 공식 오픈API(공공데이터포털 제주 관광정보 등) 별도 존재 가능 — 대량·안정 사용 시 정식 키 발급 경로 검토 권장(적재 단계에서 확인).
- `sbst` 등 본문은 저작물 — 활용 시 출처/이용조건 확인.
