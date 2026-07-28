-- ============================================================
-- FURNITURE DESIGN SYSTEM — Full Schema
-- 2026-05-29
-- ============================================================

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. HARDWARE SYSTEM (철물)
-- ============================================================

-- 철물 카테고리 (계층형)
CREATE TABLE hardware_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  parent_id   uuid REFERENCES hardware_categories(id) ON DELETE SET NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  icon        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 브랜드
CREATE TABLE hardware_brands (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text    NOT NULL,
  country_code char(2),               -- 'AT','DE','KR','CN'
  logo_url     text,
  website      text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 철물 아이템 마스터
CREATE TABLE hardware_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  uuid NOT NULL REFERENCES hardware_categories(id),
  brand_id     uuid NOT NULL REFERENCES hardware_brands(id),

  name         text NOT NULL,
  model_number text,
  spec         text NOT NULL,
  unit         text NOT NULL CHECK (unit IN ('ea','set','pair','meter')),
  unit_price   numeric(10,2) NOT NULL DEFAULT 0,

  spec_document_url text,
  image_url         text,
  notes             text,

  -- 경첩 호환성
  compatible_overlay    text[],         -- '{full}', '{half,inset}'
  boring_diameter       numeric(5,1),   -- 35.0
  opening_angle         int,            -- 110, 120, 165
  is_soft_close         boolean,
  is_push_to_open       boolean,

  -- 서랍레일 호환성
  rail_length_mm    int,
  min_depth_mm      int,
  max_depth_mm      int,
  extension_type    text CHECK (extension_type IN ('full','partial')),

  -- 슬라이딩레일 호환성
  min_width_mm  int,
  max_width_mm  int,

  -- 공통
  max_load_kg   numeric(6,1),

  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER hardware_items_updated_at
  BEFORE UPDATE ON hardware_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. MATERIAL SYSTEM (자재)
-- ============================================================

CREATE TABLE materials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,           -- "LPM 화이트 18T"
  code        text UNIQUE,
  type        text NOT NULL CHECK (type IN ('board','edge','hardware','accessory')),
  thickness_mm numeric(5,1),
  unit        text NOT NULL CHECK (unit IN ('sheet','meter','piece','set')),
  unit_price  numeric(10,2) NOT NULL DEFAULT 0,
  supplier    text,
  notes       text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CARCASS & DOOR SPECS (몸통 / 도어 사양)
-- ============================================================

-- 몸통 사양
CREATE TABLE carcass_specs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,       -- "표준형 18T"
  side_thickness      int  NOT NULL DEFAULT 18,
  top_thickness       int  NOT NULL DEFAULT 18,
  bottom_thickness    int  NOT NULL DEFAULT 18,
  back_thickness      int  NOT NULL DEFAULT 9,
  shelf_thickness     int  NOT NULL DEFAULT 18,
  divider_thickness   int  NOT NULL DEFAULT 18,
  is_default          boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 도어 사양
CREATE TABLE door_specs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  door_type       text NOT NULL CHECK (door_type IN ('swing','sliding','fold_up','fold_down','none')),
  overlay_type    text CHECK (overlay_type IN ('full','half','inset')),
  door_thickness  int  NOT NULL DEFAULT 18,
  door_count      int  NOT NULL DEFAULT 2,

  -- 경첩 보링 (swing만)
  boring_diameter       numeric(5,1),   -- 35.0
  boring_depth          numeric(5,1),   -- 13.0
  boring_edge_distance  numeric(5,1),   -- 22.5
  boring_top_distance   numeric(5,1),   -- 100
  boring_bottom_distance numeric(5,1),  -- 100

  -- 경첩 수량 공식 (변수: height)
  -- 예: "height <= 800 ? 2 : height <= 1200 ? 3 : 4"
  hinge_count_formula text,

  -- 이 도어에 필요한 철물 카테고리 슬러그 목록
  required_hardware_slugs text[] NOT NULL DEFAULT '{}',

  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. MODULE SYSTEM (가구 모듈)
-- ============================================================

-- 모듈 카테고리 (다축 분류)
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  axis        text NOT NULL CHECK (axis IN ('furniture_type','position','function','space')),
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  icon        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 모듈 마스터
CREATE TABLE modules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  code         text UNIQUE,
  description  text,

  -- 기본 치수 (mm)
  default_width   int NOT NULL,
  default_height  int NOT NULL,
  default_depth   int NOT NULL,

  -- 치수 가변 범위
  width_min   int,
  width_max   int,
  width_step  int,         -- 허용 증감 단위 (예: 100mm 단위)
  height_min  int,
  height_max  int,
  depth_min   int,
  depth_max   int,

  -- 내부 구성
  drawer_count    int NOT NULL DEFAULT 0,
  shelf_count     int NOT NULL DEFAULT 0,
  has_hanger_rod  boolean NOT NULL DEFAULT false,

  -- 기본 사양 연결
  default_carcass_spec_id uuid REFERENCES carcass_specs(id),
  default_door_spec_id    uuid REFERENCES door_specs(id),

  thumbnail_svg text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 모듈 ↔ 카테고리 (M:N)
CREATE TABLE module_categories (
  module_id   uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (module_id, category_id)
);

-- 패널 정의 (파라메트릭)
CREATE TABLE module_panels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name         text NOT NULL,    -- "옆판", "상판", "선반"
  role         text NOT NULL CHECK (role IN (
                 'side','top','bottom','back',
                 'shelf','door','drawer_front','drawer_box','divider'
               )),

  -- 공식: 변수 W(너비), H(높이), D(깊이)
  --       sT(옆판T), tT(상판T), bT(뒷판T), shT(선반T), dvT(분할판T)
  width_formula   text NOT NULL,   -- "D - bT"
  height_formula  text NOT NULL,   -- "H"
  qty_formula     text NOT NULL DEFAULT '1',  -- "2", "shelves + 1"

  -- 이 패널이 어느 두께값을 참조하는가
  thickness_ref text NOT NULL CHECK (
    thickness_ref IN ('side','top','bottom','back','shelf','divider')
  ),

  -- 엣지 처리 (노출 면)
  edge_top    boolean NOT NULL DEFAULT false,
  edge_bottom boolean NOT NULL DEFAULT false,
  edge_left   boolean NOT NULL DEFAULT false,
  edge_right  boolean NOT NULL DEFAULT false,

  default_material_id uuid REFERENCES materials(id),
  sort_order   int NOT NULL DEFAULT 0
);

-- 철물 슬롯 (모듈에 붙는 철물 자리 정의)
CREATE TABLE module_hardware_slots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id               uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slot_key                text NOT NULL,   -- "hinge", "drawer_rail_1"
  slot_name               text NOT NULL,   -- "도어 경첩"
  hardware_category_id    uuid NOT NULL REFERENCES hardware_categories(id),

  -- 활성화 조건
  trigger text NOT NULL CHECK (trigger IN (
    'always','has_door','door_swing','door_sliding',
    'door_fold_up','has_drawer','has_shelf','has_hanger'
  )),

  qty_formula   text    NOT NULL DEFAULT '1',   -- "hinge_count(H)", "drawers*2"
  is_required   boolean NOT NULL DEFAULT true,
  sort_order    int     NOT NULL DEFAULT 0,

  default_hardware_item_id uuid REFERENCES hardware_items(id),

  -- 필터 규칙
  match_door_overlay    boolean NOT NULL DEFAULT false,  -- 도어 오버레이 매칭
  match_module_depth    boolean NOT NULL DEFAULT false,  -- 깊이 기반 레일 필터
  match_module_width    boolean NOT NULL DEFAULT false,  -- 너비 기반 슬라이딩 필터
  require_soft_close    boolean,   -- null = 무관
  require_push_to_open  boolean,

  UNIQUE (module_id, slot_key)
);

-- ============================================================
-- 5. PROJECT SYSTEM (프로젝트 / 현장)
-- ============================================================

CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name          text NOT NULL,        -- "강남 도곡동 래미안 1401호"
  client_name   text NOT NULL,
  client_phone  text,
  client_email  text,
  site_address  text,

  survey_date   date,                 -- 실측일
  install_date  date,                 -- 시공일

  status text NOT NULL DEFAULT 'survey' CHECK (status IN (
    'survey',        -- 실측
    'designing',     -- 설계중
    'quoted',        -- 견적완료
    'confirmed',     -- 수주확정
    'ordered',       -- 발주완료
    'in_production', -- 제작중
    'delivered'      -- 납품완료
  )),

  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 공간 (한 프로젝트 안의 여러 공간)
CREATE TABLE spaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        text NOT NULL,          -- "안방 붙박이장", "주방"
  space_width   int NOT NULL,
  space_height  int NOT NULL,
  space_depth   int NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  notes       text
);

-- 배치된 모듈
CREATE TABLE placed_modules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  module_id   uuid NOT NULL REFERENCES modules(id),

  position_x  int NOT NULL DEFAULT 0,   -- mm 기준 X 좌표
  stack_z     int NOT NULL DEFAULT 0,   -- 0=하부장, 1=상부장

  actual_width   int NOT NULL,
  actual_height  int NOT NULL,
  actual_depth   int NOT NULL,

  carcass_spec_id uuid REFERENCES carcass_specs(id),
  door_spec_id    uuid REFERENCES door_specs(id),

  -- 패널별 자재 오버라이드 { "role": "material_id" }
  material_overrides jsonb NOT NULL DEFAULT '{}',

  antiwarp    boolean NOT NULL DEFAULT false,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 배치 모듈의 철물 선택 결과
CREATE TABLE placed_module_hardware (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placed_module_id uuid NOT NULL REFERENCES placed_modules(id) ON DELETE CASCADE,
  slot_key         text NOT NULL,
  hardware_item_id uuid NOT NULL REFERENCES hardware_items(id),
  quantity         int  NOT NULL DEFAULT 1,
  unit_price       numeric(10,2) NOT NULL DEFAULT 0,   -- 선택 시점 단가 스냅샷
  created_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (placed_module_id, slot_key)
);

-- ============================================================
-- 6. QUOTE (견적)
-- ============================================================

CREATE TABLE quotes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version     int  NOT NULL DEFAULT 1,

  material_cost   numeric(12,2) NOT NULL DEFAULT 0,
  hardware_cost   numeric(12,2) NOT NULL DEFAULT 0,
  labor_cost      numeric(12,2) NOT NULL DEFAULT 0,
  delivery_cost   numeric(12,2) NOT NULL DEFAULT 0,
  misc_cost       numeric(12,2) NOT NULL DEFAULT 0,

  margin_rate     numeric(5,2) NOT NULL DEFAULT 0,
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  margin_amount   numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,

  tax_included  boolean NOT NULL DEFAULT false,
  valid_until   date,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft','sent','accepted','rejected')
  ),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. ORDER (발주)
-- ============================================================

CREATE TABLE orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('panel','hardware','accessory')),
  supplier    text,
  status      text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft','sent','confirmed','received')
  ),
  ordered_at  timestamptz,
  expected_at date,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  material_id      uuid REFERENCES materials(id),
  hardware_item_id uuid REFERENCES hardware_items(id),
  name             text NOT NULL,
  spec             text,
  width_mm         int,
  height_mm        int,
  thickness_mm     int,
  quantity         int  NOT NULL DEFAULT 1,
  unit             text NOT NULL DEFAULT 'ea',
  unit_price       numeric(10,2) NOT NULL DEFAULT 0,
  total_price      numeric(12,2) NOT NULL DEFAULT 0,
  notes            text
);

-- ============================================================
-- 8. DOCUMENTS (생성 문서)
-- ============================================================

CREATE TABLE documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN (
                 'quote_pdf',
                 'drawing_pdf',
                 'cutlist_xlsx',
                 'panel_order_xlsx',
                 'hardware_order_xlsx'
               )),
  filename      text NOT NULL,
  file_url      text NOT NULL,
  generated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. INDEXES
-- ============================================================

CREATE INDEX idx_hardware_items_category  ON hardware_items(category_id);
CREATE INDEX idx_hardware_items_brand     ON hardware_items(brand_id);
CREATE INDEX idx_module_categories_module ON module_categories(module_id);
CREATE INDEX idx_module_categories_cat    ON module_categories(category_id);
CREATE INDEX idx_module_panels_module     ON module_panels(module_id);
CREATE INDEX idx_module_hw_slots_module   ON module_hardware_slots(module_id);
CREATE INDEX idx_spaces_project           ON spaces(project_id);
CREATE INDEX idx_placed_modules_space     ON placed_modules(space_id);
CREATE INDEX idx_placed_hw_placed         ON placed_module_hardware(placed_module_id);
CREATE INDEX idx_quotes_project           ON quotes(project_id);
CREATE INDEX idx_orders_project           ON orders(project_id);
CREATE INDEX idx_order_items_order        ON order_items(order_id);
CREATE INDEX idx_documents_project        ON documents(project_id);

-- ============================================================
-- 10. SEED DATA (기본 데이터)
-- ============================================================

-- 브랜드
INSERT INTO hardware_brands (name, country_code) VALUES
  ('블럼 (Blum)',       'AT'),
  ('헤티히 (Hettich)',  'DE'),
  ('그라스 (Grass)',    'AT'),
  ('국산',              'KR'),
  ('중국산',            'CN');

-- 철물 카테고리
INSERT INTO hardware_categories (name, slug, sort_order) VALUES
  ('경첩',        'hinge',         1),
  ('서랍레일',    'drawer_rail',   2),
  ('슬라이딩레일','sliding_rail',  3),
  ('푸쉬피팅',   'push_fitting',   4),
  ('손잡이',      'handle',        5),
  ('행거바',      'hanger_rod',    6),
  ('선반핀',      'shelf_pin',     7),
  ('캠락',        'cam_lock',      8),
  ('스테이',      'stay',          9);

-- 몸통 사양
INSERT INTO carcass_specs
  (name, side_thickness, top_thickness, bottom_thickness, back_thickness, shelf_thickness, divider_thickness, is_default)
VALUES
  ('표준형 18T',  18, 18, 18, 9,  18, 18, true),
  ('선반 25T',    18, 18, 18, 9,  25, 18, false),
  ('경량형 15T',  15, 15, 15, 9,  15, 15, false);

-- 도어 사양
INSERT INTO door_specs
  (name, door_type, overlay_type, door_thickness, door_count,
   boring_diameter, boring_depth, boring_edge_distance,
   boring_top_distance, boring_bottom_distance,
   hinge_count_formula, required_hardware_slugs, is_default)
VALUES
  ('여닫이 풀오버레이 18T', 'swing',   'full',  18, 2,
   35, 13, 22.5, 100, 100,
   'height <= 800 ? 2 : height <= 1200 ? 3 : 4',
   '{hinge}', true),

  ('여닫이 하프오버레이 18T', 'swing',  'half',  18, 2,
   35, 13, 22.5, 100, 100,
   'height <= 800 ? 2 : height <= 1200 ? 3 : 4',
   '{hinge}', false),

  ('여닫이 인셋 18T',        'swing',   'inset', 18, 2,
   35, 13, 22.5, 100, 100,
   'height <= 800 ? 2 : height <= 1200 ? 3 : 4',
   '{hinge}', false),

  ('슬라이딩 2짝',           'sliding', null,    18, 2,
   null, null, null, null, null, null,
   '{sliding_rail}', false),

  ('폴딩업',                 'fold_up', null,    18, 1,
   null, null, null, null, null, null,
   '{stay}', false),

  ('도어 없음',              'none',    null,     0, 0,
   null, null, null, null, null, null,
   '{}', false);

-- 가구 카테고리
INSERT INTO categories (name, slug, axis, sort_order) VALUES
  -- furniture_type
  ('붙박이장',   'wardrobe',    'furniture_type', 1),
  ('주방가구',   'kitchen',     'furniture_type', 2),
  ('홈오피스',   'home_office', 'furniture_type', 3),
  ('거실장',     'living',      'furniture_type', 4),
  ('드레스룸',   'dressroom',   'furniture_type', 5),
  -- position
  ('하부장',     'base',        'position', 1),
  ('상부장',     'upper',       'position', 2),
  ('키큰장',     'tall',        'position', 3),
  ('코너장',     'corner',      'position', 4),
  ('팬트리',     'pantry',      'position', 5),
  -- function
  ('서랍형',     'drawer',      'function', 1),
  ('선반형',     'shelf',       'function', 2),
  ('행거형',     'hanger',      'function', 3),
  ('도어형',     'door',        'function', 4),
  ('혼합형',     'mixed',       'function', 5),
  ('오픈형',     'open',        'function', 6);
