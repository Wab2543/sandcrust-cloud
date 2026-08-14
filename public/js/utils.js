// 沙结智汇云 通用工具函数

const API_BASE = '/api';

// API请求封装
async function api(path, options = {}) {
  const url = API_BASE + path;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || 'Request failed: ' + res.status);
    }
    return await res.json();
  } catch (e) {
    showToast(e.message, 'error');
    throw e;
  }
}

// GET请求
function apiGet(path) {
  return api(path, { method: 'GET' });
}

// POST请求
function apiPost(path, data) {
  return api(path, { method: 'POST', body: JSON.stringify(data) });
}

// Toast通知
function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 格式化日期时间
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// 获取标签HTML
function getTagHtml(level) {
  const map = {
    'green': '<span class="tag tag-green">绿色</span>',
    'yellow': '<span class="tag tag-yellow">黄色</span>',
    'red': '<span class="tag tag-red">红色</span>'
  };
  return map[level] || '<span class="tag">' + level + '</span>';
}

// 获取值或占位符
function valOrDash(v) {
  return (v === null || v === undefined || v === '') ? '-' : v;
}

// 加载仪表盘数据
async function loadDashboard() {
  try {
    return await apiGet('/dashboard');
  } catch (e) {
    return null;
  }
}

// 获取项目列表
async function loadProjects() {
  try {
    const r = await apiGet('/projects');
    return r.data || [];
  } catch (e) {
    return [];
  }
}

// 获取阈值数据
async function loadThresholds(category) {
  try {
    const r = await apiGet('/thresholds' + (category ? '?category=' + category : ''));
    return r.data || [];
  } catch (e) {
    return [];
  }
}
