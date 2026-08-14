// 沙结智汇云 数据库操作层
// Cloudflare D1 (SQLite) CRUD封装

// ---- 项目 ----

export async function createProject(db, name, location) {
  const r = await db.prepare(
    'INSERT INTO projects (name, location) VALUES (?, ?)'
  ).bind(name, location || '').run();
  return r.meta.last_row_id;
}

export async function listProjects(db) {
  const r = await db.prepare(
    'SELECT * FROM projects ORDER BY created_at DESC'
  ).all();
  return r.results;
}

export async function getProject(db, id) {
  const r = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return r;
}

// ---- 选址评估 ----

export async function saveAssessment(db, data) {
  const r = await db.prepare(`
    INSERT INTO assessments (project_id, annual_precip, annual_temp, precip_seasonality,
      soil_total_n, soil_total_p, gravel_content, elevation, salinization, wind_days,
      vegetation_cover, result, score, detail, suggestions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.project_id, data.annual_precip, data.annual_temp, data.precip_seasonality,
    data.soil_total_n, data.soil_total_p, data.gravel_content, data.elevation,
    data.salinization, data.wind_days, data.vegetation_cover,
    data.result, data.score, data.detail, data.suggestions
  ).run();
  return r.meta.last_row_id;
}

export async function getAssessments(db, projectId) {
  if (projectId) {
    const r = await db.prepare(
      'SELECT a.*, p.name as project_name FROM assessments a LEFT JOIN projects p ON a.project_id = p.id WHERE a.project_id = ? ORDER BY a.created_at DESC'
    ).bind(projectId).all();
    return r.results;
  }
  const r = await db.prepare(
    'SELECT a.*, p.name as project_name FROM assessments a LEFT JOIN projects p ON a.project_id = p.id ORDER BY a.created_at DESC LIMIT 20'
  ).all();
  return r.results;
}

// ---- 监测数据 ----

export async function saveMonitorEnv(db, data) {
  const r = await db.prepare(`
    INSERT INTO monitor_env (project_id, temp, light_intensity, light_hours, soil_water,
      water_amount, humidity, nutrient_freq, period_days, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.project_id, data.temp, data.light_intensity, data.light_hours, data.soil_water,
    data.water_amount, data.humidity, data.nutrient_freq, data.period_days, data.notes || ''
  ).run();
  return r.meta.last_row_id;
}

export async function saveMonitorCrust(db, data) {
  const r = await db.prepare(`
    INSERT INTO monitor_crust (project_id, coverage, thickness, chl_a, compressive_strength,
      wind_erosion_rate, roughness, crust_color, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.project_id, data.coverage, data.thickness, data.chl_a, data.compressive_strength,
    data.wind_erosion_rate, data.roughness, data.crust_color, data.notes || ''
  ).run();
  return r.meta.last_row_id;
}

export async function saveMonitorSoil(db, data) {
  const r = await db.prepare(`
    INSERT INTO monitor_soil (project_id, organic_matter, total_n, total_p, total_k, ph, fine_matter, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.project_id, data.organic_matter, data.total_n, data.total_p, data.total_k, data.ph, data.fine_matter, data.notes || ''
  ).run();
  return r.meta.last_row_id;
}

export async function saveMonitorOps(db, data) {
  const r = await db.prepare(`
    INSERT INTO monitor_ops (project_id, algae_ratio, askg_concentration, bacteria_type,
      bacteria_amount, inoculum_amount, soil_bulk_density, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.project_id, data.algae_ratio, data.askg_concentration, data.bacteria_type,
    data.bacteria_amount, data.inoculum_amount, data.soil_bulk_density, data.notes || ''
  ).run();
  return r.meta.last_row_id;
}

export async function saveMonitorCarbon(db, data) {
  const r = await db.prepare(`
    INSERT INTO monitor_carbon (project_id, photosynthesis_rate, soil_respiration, notes)
    VALUES (?, ?, ?, ?)
  `).bind(data.project_id, data.photosynthesis_rate, data.soil_respiration, data.notes || '').run();
  return r.meta.last_row_id;
}

export async function getMonitorRecords(db, projectId, module) {
  const tableMap = {
    'env': 'monitor_env',
    'crust': 'monitor_crust',
    'soil': 'monitor_soil',
    'ops': 'monitor_ops',
    'carbon': 'monitor_carbon'
  };
  const table = tableMap[module];
  if (!table) return [];

  if (projectId) {
    const r = await db.prepare(
      `SELECT * FROM ${table} WHERE project_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(projectId).all();
    return r.results;
  }
  const r = await db.prepare(
    `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 20`
  ).all();
  return r.results;
}

export async function getMonitorAll(db, projectId) {
  const modules = ['monitor_env', 'monitor_crust', 'monitor_soil', 'monitor_ops', 'monitor_carbon'];
  const result = {};
  for (const m of modules) {
    const r = await db.prepare(
      `SELECT * FROM ${m} WHERE project_id = ? ORDER BY created_at DESC LIMIT 5`
    ).bind(projectId).all();
    result[m.replace('monitor_', '')] = r.results;
  }
  return result;
}

// ---- 告警 ----

export async function createAlert(db, projectId, indicator, level, message) {
  const r = await db.prepare(
    'INSERT INTO alerts (project_id, indicator, level, message) VALUES (?, ?, ?, ?)'
  ).bind(projectId, indicator, level, message).run();
  return r.meta.last_row_id;
}

export async function getAlerts(db) {
  const r = await db.prepare(
    'SELECT a.*, p.name as project_name FROM alerts a LEFT JOIN projects p ON a.project_id = p.id ORDER BY a.created_at DESC LIMIT 50'
  ).all();
  return r.results;
}

export async function markAlertRead(db, id) {
  await db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').bind(id).run();
}

// ---- 阈值 ----

export async function getThresholds(db, category) {
  if (category) {
    const r = await db.prepare(
      'SELECT * FROM thresholds WHERE category = ? ORDER BY id'
    ).bind(category).all();
    return r.results;
  }
  const r = await db.prepare('SELECT * FROM thresholds ORDER BY category, id').all();
  return r.results;
}
