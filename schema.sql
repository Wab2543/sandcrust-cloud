-- 沙结智汇云 数据库结构
-- Cloudflare D1 (SQLite兼容)

-- 项目/场地信息表
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 第一层：选址评估记录表
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  -- 10项评估因子
  annual_precip REAL,           -- 年降水量 (mm)
  annual_temp REAL,             -- 年平均气温 (C)
  precip_seasonality REAL,      -- 降水量季节性变化 (mm)
  soil_total_n REAL,            -- 土壤全氮含量 (g/kg)
  soil_total_p REAL,            -- 土壤全磷含量 (g/kg)
  gravel_content REAL,          -- 砾石含量 (%)
  elevation REAL,               -- 海拔 (m)
  salinization TEXT,            -- 盐渍化状况
  wind_days REAL,               -- 大风日数 (d/y)
  vegetation_cover REAL,        -- 植被盖度 (%)
  -- 判定结果
  result TEXT,                  -- green / yellow / red
  score INTEGER,                -- 超出阈值项数
  detail TEXT,                  -- 各项判定详情 JSON
  suggestions TEXT,             -- 工程建议
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 第二层-模块一：环境培育条件
CREATE TABLE IF NOT EXISTS monitor_env (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  temp REAL,                    -- 培育温度 (C)
  light_intensity REAL,         -- 光照强度 (Lx)
  light_hours REAL,             -- 光照时长 (h/d)
  soil_water REAL,              -- 土壤含水量 (%)
  water_amount REAL,            -- 补水量 (L/m2/d)
  humidity REAL,                -- 空气相对湿度 (%RH)
  nutrient_freq REAL,           -- 营养液添加 (次/周)
  period_days INTEGER,          -- 养护时长 (天)
  notes TEXT,                   -- 备注
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 第二层-模块二：结皮生长状况
CREATE TABLE IF NOT EXISTS monitor_crust (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  coverage REAL,                -- 结皮盖度 (%)
  thickness REAL,               -- 结皮厚度 (mm)
  chl_a REAL,                   -- 生物量Chl-a (ug/cm2)
  compressive_strength REAL,     -- 抗压强度 (kg/cm2)
  wind_erosion_rate REAL,       -- 风蚀率 (g/(m2·min))
  roughness TEXT,               -- 表面粗糙度 定性
  crust_color TEXT,             -- 结皮颜色/类型
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 第二层-模块三：土壤养分改良
CREATE TABLE IF NOT EXISTS monitor_soil (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  organic_matter REAL,          -- 土壤有机质 (g/kg)
  total_n REAL,                 -- 土壤全氮 (g/kg)
  total_p REAL,                 -- 土壤全磷 (g/kg)
  total_k REAL,                 -- 土壤全钾 (g/kg)
  ph REAL,                      -- 土壤pH
  fine_matter REAL,             -- 土壤细物质含量 (%)
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 第二层-模块四：操作管理记录
CREATE TABLE IF NOT EXISTS monitor_ops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  algae_ratio TEXT,             -- 藻种配比 (默认 MV:SJ:PT=10:1:5)
  askg_concentration REAL,      -- ASKG浓度 (%)
  bacteria_type TEXT,           -- 菌剂类型 (BS/BM)
  bacteria_amount REAL,         -- 菌剂添加量 (g/kg)
  inoculum_amount REAL,         -- 接种液喷洒量 (L/m2)
  soil_bulk_density REAL,       -- 沙壤容重 (g/cm3)
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 第二层-模块五：碳汇监测
CREATE TABLE IF NOT EXISTS monitor_carbon (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  photosynthesis_rate REAL,     -- 净光合速率 (umol/(m2·s))
  soil_respiration REAL,        -- 土壤呼吸速率 (umol/(m2·s))
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 阈值参考表（预填充科研数据）
CREATE TABLE IF NOT EXISTS thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,       -- assess / monitor_env / monitor_crust / etc.
  indicator TEXT NOT NULL,      -- 指标名称
  unit TEXT,                    -- 单位
  optimal_min REAL,             -- 最适区间下限
  optimal_max REAL,             -- 最适区间上限
  unsuitable_threshold TEXT,    -- 非适生/异常阈值 (支持不等式格式)
  suggestion_red TEXT,          -- 红色预警建议
  suggestion_yellow TEXT,       -- 黄色预警建议
  suggestion_green TEXT         -- 绿色达标建议
);

-- 告警记录表
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  indicator TEXT NOT NULL,
  value REAL,
  threshold TEXT,
  level TEXT,                   -- red / yellow
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
