// 沙结智汇云 - Cloudflare Worker 主入口
// 路由分发 + 请求处理

import { assessSite, checkMonitorEnv, checkMonitorCrust, checkMonitorSoil, checkMonitorCarbon } from './engine.js';
import {
  createProject, listProjects, getProject,
  saveAssessment, getAssessments,
  saveMonitorEnv, saveMonitorCrust, saveMonitorSoil, saveMonitorOps, saveMonitorCarbon,
  getMonitorRecords, getMonitorAll,
  createAlert, getAlerts, markAlertRead,
  getThresholds
} from './db.js';
import { validateAssess, validateMonitor } from './validate.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;

    // CORS headers
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // ==================== API Routes ====================
    // 仅处理 /api/* 路径，其他由静态资源处理
    if (!path.startsWith('/api/')) {
      // 本地开发模式：返回静态文件
      if (path === '/' || path === '') path = '/index.html';
      const mimeMap = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
      };
      try {
        const asset = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
        if (asset.status !== 404) {
          // 确保静态资源返回正确的 Content-Type 含 charset
          const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
          const contentType = mimeMap[ext];
          if (contentType) {
            const newHeaders = new Headers(asset.headers);
            newHeaders.set('Content-Type', contentType);
            return new Response(asset.body, { status: asset.status, headers: newHeaders });
          }
          return asset;
        }
      } catch (e) {}
      // 如果静态资源不存在，返回 index.html（SPA fallback）
      try {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
      } catch (e) {
        return new Response('404 Not Found', { status: 404, headers: cors });
      }
    }

    try {
      let response;

      // ---- 项目管理 ----
      if (path === '/api/projects' && request.method === 'GET') {
        response = await handleListProjects(env);

      } else if (path === '/api/projects' && request.method === 'POST') {
        const body = await request.json();
        response = await handleCreateProject(env, body);

      } else if (path === '/api/projects/assess' && request.method === 'POST') {
        const body = await request.json();
        response = await handleAssess(env, body);

      } else if (path === '/api/projects/assess' && request.method === 'GET') {
        const projectId = url.searchParams.get('project_id');
        response = await handleGetAssessments(env, projectId);

      // ---- 监测数据 ----
      } else if (path === '/api/monitor' && request.method === 'POST') {
        const body = await request.json();
        response = await handleMonitor(env, body);

      } else if (path === '/api/monitor' && request.method === 'GET') {
        const projectId = url.searchParams.get('project_id');
        const module = url.searchParams.get('module');
        response = await handleGetMonitor(env, projectId, module);

      // ---- 告警 ----
      } else if (path === '/api/alerts' && request.method === 'GET') {
        response = await handleGetAlerts(env);

      } else if (path === '/api/alerts/read' && request.method === 'POST') {
        const body = await request.json();
        response = await handleMarkAlertRead(env, body.id);

      // ---- 阈值参考 ----
      } else if (path === '/api/thresholds' && request.method === 'GET') {
        const category = url.searchParams.get('category');
        response = await handleGetThresholds(env, category);

      // ---- 仪表盘统计 ----
      } else if (path === '/api/dashboard' && request.method === 'GET') {
        response = await handleDashboard(env);

      } else {
        response = { status: 404, body: { error: 'API not found' } };
      }

      return new Response(
        JSON.stringify(response.body || response),
        { headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }
};

// ==================== API Handler Functions ====================

async function handleListProjects(env) {
  const db = env.DB;
  const projects = await listProjects(db);
  return { body: { data: projects } };
}

async function handleCreateProject(env, body) {
  const db = env.DB;
  if (!body.name) throw new Error('项目名称不能为空');
  const id = await createProject(db, body.name, body.location || '');
  return { body: { data: { id, name: body.name } } };
}

async function handleAssess(env, body) {
  const db = env.DB;
  const errors = validateAssess(body);
  if (errors.length > 0) throw new Error('校验失败: ' + errors.join(', '));

  // 执行规则引擎判定
  const result = assessSite(body);

  // 保存评估记录
  const assessmentId = await saveAssessment(db, {
    project_id: body.project_id,
    annual_precip: body.annual_precip,
    annual_temp: body.annual_temp,
    precip_seasonality: body.precip_seasonality,
    soil_total_n: body.soil_total_n,
    soil_total_p: body.soil_total_p,
    gravel_content: body.gravel_content,
    elevation: body.elevation,
    salinization: body.salinization,
    wind_days: body.wind_days,
    vegetation_cover: body.vegetation_cover,
    result: result.level,
    score: result.failCount,
    detail: JSON.stringify(result.details),
    suggestions: result.summary
  });

  // 生成告警
  for (const d of result.details) {
    if (d.level === 'red' || d.level === 'yellow') {
      await createAlert(db, body.project_id, d.name, d.level, d.suggestion);
    }
  }

  return { body: { data: { id: assessmentId, ...result } } };
}

async function handleGetAssessments(env, projectId) {
  const db = env.DB;
  const records = await getAssessments(db, projectId || null);
  return { body: { data: records } };
}

async function handleMonitor(env, body) {
  const db = env.DB;
  const errors = validateMonitor(body);
  if (errors.length > 0) throw new Error('校验失败: ' + errors.join(', '));

  const { module, project_id, ...data } = body;
  let checks = null;

  switch (module) {
    case 'env':
      await saveMonitorEnv(db, { project_id, ...data });
      checks = checkMonitorEnv(data);
      break;
    case 'crust':
      await saveMonitorCrust(db, { project_id, ...data });
      checks = checkMonitorCrust(data);
      break;
    case 'soil':
      await saveMonitorSoil(db, { project_id, ...data });
      checks = checkMonitorSoil(data);
      break;
    case 'ops':
      await saveMonitorOps(db, { project_id, ...data });
      checks = { level: 'green', alerts: [], summary: '操作参数已记录' };
      break;
    case 'carbon':
      await saveMonitorCarbon(db, { project_id, ...data });
      checks = checkMonitorCarbon(data);
      break;
    default:
      throw new Error('未知监测模块: ' + module);
  }

  // 生成告警
  if (checks && checks.alerts) {
    for (const a of checks.alerts) {
      await createAlert(db, project_id, a.name, a.level, a.suggestion);
    }
  }

  return { body: { data: { module, checks } } };
}

async function handleGetMonitor(env, projectId, module) {
  const db = env.DB;
  if (module && module !== 'all') {
    const records = await getMonitorRecords(db, projectId, module);
    return { body: { data: records } };
  }
  const records = await getMonitorAll(db, projectId);
  return { body: { data: records } };
}

async function handleGetAlerts(env) {
  const db = env.DB;
  const alerts = await getAlerts(db);
  return { body: { data: alerts } };
}

async function handleMarkAlertRead(env, id) {
  const db = env.DB;
  await markAlertRead(db, id);
  return { body: { success: true } };
}

async function handleGetThresholds(env, category) {
  const db = env.DB;
  const thresholds = await getThresholds(db, category || null);
  return { body: { data: thresholds } };
}

async function handleDashboard(env) {
  const db = env.DB;
  const projects = await listProjects(db);
  const alerts = await getAlerts(db);
  const activeAlerts = alerts.filter(a => !a.is_read);
  const assessments = await getAssessments(db, null);

  const stats = {
    totalProjects: projects.length,
    activeAlerts: activeAlerts.length,
    greenCount: assessments.filter(a => a.result === 'green').length,
    yellowCount: assessments.filter(a => a.result === 'yellow').length,
    redCount: assessments.filter(a => a.result === 'red').length,
    latestAssessments: assessments.slice(0, 5),
    latestAlerts: activeAlerts.slice(0, 10)
  };

  return { body: { data: stats } };
}
