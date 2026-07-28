export interface PriceSettings {
  woodFramePerBay: number;    // 목대 (칸당)
  doorPerBay: number;         // 도어 (칸당)
  finishPanel: number;        // 마감판 (장당)
  hangerRod: number;          // 행거바 (개당)
  shelf: number;              // 선반 (장당)
  drawer: number;             // 서랍 (개당)
  antiwarpPerShelf: number;   // 휨방지 (선반 1장당)
  installation: number;       // 설치비 (일식)
  shippingFee: number;        // 운임비 (일식)
  miscFee: number;            // 폐기물 처리 및 기타 (일식)
  hingeDomestic: number;          // 경첩 국산/중국산 (개당)
  hingeEuro: number;              // 경첩 유럽산 블럼/헤티히 (개당)
  drawerRailDomestic: number;     // 서랍레일 국산 (세트당)
  drawerRailEuro: number;         // 서랍레일 유럽산 블럼/헤티히 (세트당)
  pushFittingDomestic: number;    // 푸쉬철물 국산 (개당)
  pushFittingEuro: number;        // 푸쉬철물 유럽산 블럼 (개당)
  drawerAssembly: number;         // 서랍 조립비 (개당)
}

export interface TemplateConfig {
  id: string;
  name: string;
  hangerRods: number;
  shelves: number;
  drawers: number;
}

export interface BayConfig {
  id: string;
  templateId: string | null;
  antiwarp: boolean;
}
