import type { PriceSettings, TemplateConfig } from "./types";

export const TEMPLATES: TemplateConfig[] = [
  {
    id: "double_hanger",
    name: "2단 행거형",
    hangerRods: 2,
    shelves: 0,
    drawers: 0,
  },
  {
    id: "single_2drawer",
    name: "1단 2개서랍형",
    hangerRods: 1,
    shelves: 0,
    drawers: 2,
  },
  {
    id: "double_4shelf_duvet",
    name: "2단 4선반\n이불수납형",
    hangerRods: 0,
    shelves: 4,
    drawers: 0,
  },
  {
    id: "double_hanger_shelf",
    name: "2단 행거선반형",
    hangerRods: 1,
    shelves: 2,
    drawers: 0,
  },
  {
    id: "double_t_shelf",
    name: "2단 T선반형",
    hangerRods: 1,
    shelves: 3,
    drawers: 0,
  },
  {
    id: "single_1drawer",
    name: "1단 1개서랍형",
    hangerRods: 1,
    shelves: 1,
    drawers: 1,
  },
  {
    id: "shelf3_drawer4",
    name: "3단선반\n4서랍형",
    hangerRods: 0,
    shelves: 3,
    drawers: 4,
  },
];

export const DEFAULT_PRICES: PriceSettings = {
  woodFramePerBay: 80_000,
  doorPerBay: 30_000,
  finishPanel: 25_000,
  hangerRod: 15_000,
  shelf: 18_000,
  drawer: 55_000,
  antiwarpPerShelf: 8_000,
  installation: 150_000,
  shippingFee: 200_000,
  miscFee: 200_000,
  hingeDomestic: 800,
  hingeEuro: 5_000,
  drawerRailDomestic: 3_000,
  drawerRailEuro: 20_000,
  pushFittingDomestic: 2_000,
  pushFittingEuro: 8_000,
  drawerAssembly: 10_000,
};

export const PRICE_LABELS: Record<keyof PriceSettings, string> = {
  woodFramePerBay: "목대 (자당)",
  doorPerBay: "도어 (개당, ×2/칸)",
  finishPanel: "마감판 (장당)",
  hangerRod: "행거바 (개당)",
  shelf: "선반 (장당)",
  drawer: "서랍 (개당)",
  antiwarpPerShelf: "휨방지 (선반당)",
  installation: "설치비 (일식)",
  shippingFee: "운임비 (일식)",
  miscFee: "폐기물 처리 및 기타 (일식)",
  hingeDomestic: "경첩 국산/중국산 (개당)",
  hingeEuro: "경첩 유럽산 블럼/헤티히 (개당)",
  drawerRailDomestic: "서랍레일 국산 (세트당)",
  drawerRailEuro: "서랍레일 유럽산 블럼/헤티히 (세트당)",
  pushFittingDomestic: "푸쉬철물 국산 (개당)",
  pushFittingEuro: "푸쉬철물 유럽산 블럼 (개당)",
  drawerAssembly: "서랍 조립비 (개당)",
};

export const STORAGE_KEY = "layer101_wardrobe_prices";
