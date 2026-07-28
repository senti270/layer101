-- ============================================================
-- Wall 기반 공간 구조 추가
-- spaces → walls → placed_modules
-- ============================================================

-- 벽면 테이블
CREATE TABLE walls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id     uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  name         text NOT NULL,           -- "정면 (A)", "우측 (B)"
  width        int  NOT NULL,
  height       int  NOT NULL,
  depth        int  NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  -- 다음 벽면과의 코너 연결 타입
  corner_to_next text CHECK (corner_to_next IN ('filler','blind','carousel')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_walls_space ON walls(space_id);

-- placed_modules에 wall_id 추가
ALTER TABLE placed_modules
  ADD COLUMN wall_id uuid REFERENCES walls(id) ON DELETE CASCADE;

CREATE INDEX idx_placed_modules_wall ON placed_modules(wall_id);

-- 공간 shape 타입 추가 (일자, ㄱ자, ㄷ자)
ALTER TABLE spaces
  ADD COLUMN shape text NOT NULL DEFAULT 'linear'
    CHECK (shape IN ('linear','l_shape','u_shape','custom'));
