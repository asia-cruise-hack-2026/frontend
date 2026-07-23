// 시안 마커 언어(디자인 EXPLORE :247-253) — 이름 라벨 pill + 스템, 정박항=검정 pill+배 아이콘.
// 실지도에선 Marker의 커스텀 SVG(data URL)로 재현한다 — AdvancedMarker(mapId 필요) 없이 동작.
// 색은 CSS 변수를 못 쓰는 이미지 컨텍스트라 리터럴: 브랜드 블루=#2563EB(brand.css), 선택=바이올렛 #8B3FF0(디자인 :1707), 정박항=#171719.

export const PIN_BRAND = "#2563EB";
export const PIN_SELECTED = "#8B3FF0";
const PIN_PORT = "#171719";

const FONT = 11;
const PILL_H = 22;
const STEM_H = 9;
const PAD_X = 10;
const MARGIN = 6; // drop-shadow 여백(좌우·상단) — 하단은 스템 끝=캔버스 바닥이라 기본 anchor(하단 중앙)가 지점에 꽂힌다

const escapeXml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// 11px/600 폭 추정 — CJK 11px·그 외 6.4px (SVG엔 실측이 없어 근사)
const textWidth = (s: string) => {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x2e80 ? FONT : FONT * 0.58;
  return Math.ceil(w);
};

const SHADOW =
  '<filter id="s" x="-40%" y="-40%" width="180%" height="220%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-opacity="0.25"/></filter>';

const svgUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

// 디자인 :92 배 아이콘 path(24 기준)를 pill 안에 11px로 축소해 넣는다
const SHIP_PATHS =
  '<path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1"/><path d="M4 18l-1 -5h18l-2 4"/><path d="M5 13v-6h8l4 6"/><path d="M7 7v-4h-1"/>';

interface PinIcon {
  url: string;
}

/** 스팟 이름 pill 마커 — 시안 스팟 핀. color 기본=브랜드, 선택(일정/목적지)=PIN_SELECTED */
export function spotPin(name: string, color: string = PIN_BRAND): PinIcon {
  const tw = textWidth(name);
  const pillW = tw + PAD_X * 2;
  const w = pillW + MARGIN * 2;
  const h = MARGIN + PILL_H + STEM_H;
  const cx = w / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${SHADOW}` +
    `<g filter="url(#s)">` +
    `<rect x="${MARGIN}" y="${MARGIN}" width="${pillW}" height="${PILL_H}" rx="${PILL_H / 2}" fill="${color}"/>` +
    `<rect x="${cx - 1}" y="${MARGIN + PILL_H}" width="2" height="${STEM_H}" fill="${color}"/>` +
    `</g>` +
    `<text x="${cx}" y="${MARGIN + PILL_H / 2 + 0.5}" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${FONT}" font-weight="600" fill="#fff">${escapeXml(name)}</text>` +
    `</svg>`;
  return { url: svgUrl(svg) };
}

/** 정박항 마커 — 시안 :247 검정 pill + 배 아이콘 + 항구명. 스템 포함(지점 고정). */
export function portPin(name: string): PinIcon {
  const iconW = 13;
  const tw = textWidth(name);
  const pillW = tw + iconW + 4 + PAD_X * 2;
  const w = pillW + MARGIN * 2;
  const h = MARGIN + PILL_H + STEM_H;
  const cx = w / 2;
  const iconX = MARGIN + PAD_X;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${SHADOW}` +
    `<g filter="url(#s)">` +
    `<rect x="${MARGIN}" y="${MARGIN}" width="${pillW}" height="${PILL_H}" rx="${PILL_H / 2}" fill="${PIN_PORT}"/>` +
    `<rect x="${cx - 1}" y="${MARGIN + PILL_H}" width="2" height="${STEM_H}" fill="${PIN_PORT}"/>` +
    `</g>` +
    `<g transform="translate(${iconX},${MARGIN + (PILL_H - iconW) / 2}) scale(${iconW / 24})" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${SHIP_PATHS}</g>` +
    `<text x="${iconX + iconW + 4}" y="${MARGIN + PILL_H / 2 + 0.5}" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="${FONT}" font-weight="700" fill="#fff">${escapeXml(name)}</text>` +
    `</svg>`;
  return { url: svgUrl(svg) };
}

/** 경로 순번 마커 — 번호 원(24px) + 스템. 최종 경로 실지도용 */
export function numberedPin(no: number): PinIcon {
  const d = 24;
  const stem = 8;
  const w = d + MARGIN * 2;
  const h = MARGIN + d + stem;
  const cx = w / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${SHADOW}` +
    `<g filter="url(#s)">` +
    `<circle cx="${cx}" cy="${MARGIN + d / 2}" r="${d / 2}" fill="${PIN_BRAND}"/>` +
    `<rect x="${cx - 1}" y="${MARGIN + d}" width="2" height="${stem}" fill="${PIN_BRAND}"/>` +
    `</g>` +
    `<circle cx="${cx}" cy="${MARGIN + d / 2}" r="${d / 2 - 1}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.5"/>` +
    `<text x="${cx}" y="${MARGIN + d / 2 + 0.5}" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#fff">${no}</text>` +
    `</svg>`;
  return { url: svgUrl(svg) };
}

/** 내 위치 — 파란 점 + 흰 링 + 옅은 헤일로. 점 중심이 지점에 오도록 하단을 헤일로 반지름으로 마감. */
export function myDot(): PinIcon {
  // 기본 anchor(하단 중앙) 특성상 원 중심을 정확히 지점에 둘 수 없어, 캔버스 바닥=원 하단으로 두면 반지름(9px)만큼 위로 뜬다.
  // 지도 스케일에선 체감 오차가 작아 그대로 둔다(구글 Point 인스턴스 의존을 피하기 위한 트레이드오프).
  const r = 7;
  const halo = 9;
  const size = halo * 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${halo}" cy="${halo}" r="${halo}" fill="rgba(37,99,235,0.2)"/>` +
    `<circle cx="${halo}" cy="${halo}" r="${r}" fill="${PIN_BRAND}" stroke="#fff" stroke-width="2.5"/>` +
    `</svg>`;
  return { url: svgUrl(svg) };
}
