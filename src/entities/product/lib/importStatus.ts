import type { StringKey } from "@/shared/i18n";

import type { Product } from "../model/types";

// 디자인 SM(:1615-1618) 이식 — 반입상태 뱃지 메타(배경·색상·아이콘·라벨 키). iconName은 wds-icon
// 컴포넌트명 매핑용, labelKey는 useI18n t()로 라벨 해석용 — 둘 다 화면 책임.
export interface ImportStatusMeta {
  bg: string;
  color: string;
  iconName: string;
  labelKey: StringKey;
}

export const IMPORT_STATUS_META: Record<Product["importStatus"], ImportStatusMeta> = {
  allowed: {
    bg: "#EAF7EE",
    color: "#12A150",
    iconName: "circleCheckFill",
    labelKey: "imp_allowed",
  },
  conditional: {
    bg: "#FFF6E0",
    color: "#C08A00",
    iconName: "circleInfoFill",
    labelKey: "imp_conditional",
  },
  restricted: {
    bg: "#FFF0E0",
    color: "#C7690A",
    iconName: "triangleExclamationFill",
    labelKey: "imp_restricted",
  },
  prohibited: {
    bg: "#FDECEC",
    color: "#E23B3B",
    iconName: "circleCloseFill",
    labelKey: "imp_prohibited",
  },
};
