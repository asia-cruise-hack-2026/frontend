// 디자인 renderVals(:1589, :1594-1595) 이식 — 택시/밴 요금·이동시간 계산.

/** 택시 요금: (4300 + round(totalKm)*1700) * serviceMul, 100원 반올림. 글로벌택시면 serviceMul=1.25 */
export function taxiFare(totalKm: number, serviceMul = 1): number {
  return Math.round(((4300 + Math.round(totalKm) * 1700) * serviceMul) / 100) * 100;
}

/** 밴 요금 = 택시요금 * 1.55, 100원 반올림 (디자인 :1594) */
export function vanFare(taxiFareValue: number): number {
  return Math.round((taxiFareValue * 1.55) / 100) * 100;
}

/** 택시 예상 이동 분: max(8, round(totalKm*2.4)) (디자인 :1589) */
export function taxiMinutes(totalKm: number): number {
  return Math.max(8, Math.round(totalKm * 2.4));
}
