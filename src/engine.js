// 沙结智汇云 规则引擎
// 所有判定逻辑基于科研文献中的阈值数据
// 文献一: 张鑫钰等. 中国旱区生物土壤结皮分布格局及限制因素. 生态学报, 2026
// 文献二: 康红梅等. 一种蓝藻、沙蒿胶及微生物菌剂联合固沙新方法研究. 环境生态学, 2025

// ---- 通用判定工具 ----

function checkRange(value, opts) {
  // opts: { min, max, redMin, redMax, name, unit, suggestionRed, suggestionYellow, suggestionGreen }
  if (value === null || value === undefined || value === '') return null;

  const v = parseFloat(value);
  if (isNaN(v)) return null;

  // 红色判定
  if (opts.redMin !== undefined && v <= opts.redMin) {
    return { name: opts.name, value: v, unit: opts.unit || '', level: 'red',
      suggestion: opts.suggestionRedLow || opts.suggestionRed };
  }
  if (opts.redMax !== undefined && v >= opts.redMax) {
    return { name: opts.name, value: v, unit: opts.unit || '', level: 'red',
      suggestion: opts.suggestionRedHigh || opts.suggestionRed };
  }

  // 黄色判定
  if (opts.yellowMin !== undefined && v <= opts.yellowMin) {
    return { name: opts.name, value: v, unit: opts.unit || '', level: 'yellow', suggestion: opts.suggestionYellow };
  }
  if (opts.yellowMax !== undefined && v >= opts.yellowMax) {
    return { name: opts.name, value: v, unit: opts.unit || '', level: 'yellow', suggestion: opts.suggestionYellow };
  }

  // 绿色判定
  if (opts.min !== undefined && v < opts.min) {
    return { name: opts.name, value: v, unit: opts.unit || '', level: 'yellow', suggestion: opts.suggestionYellow };
  }
  if (opts.max !== undefined && v > opts.max) {
    return { name: opts.name, value: v, unit: opts.unit || '', level: 'yellow', suggestion: opts.suggestionYellow };
  }

  return { name: opts.name, value: v, unit: opts.unit || '', level: 'green', suggestion: opts.suggestionGreen || '正常' };
}

// ---- 第一层：场地适宜性评估 ----

export function assessSite(params) {
  const details = [];

  // 年降水量
  details.push(checkRange(params.annual_precip, {
    name: '年降水量', unit: 'mm',
    min: 85, max: 400,
    redMin: 85, suggestionRed: '极端干旱区，直接判为非适生。建议放弃或仅寻找特殊微生境。',
    yellowMin: 150, suggestionYellow: '降水偏低，须配套人工补水设施；>400mm时高等植物竞争风险需评估。',
    suggestionGreen: '降水适宜，可正常开展。'
  }));

  // 年平均气温
  details.push(checkRange(params.annual_temp, {
    name: '年平均气温', unit: 'C',
    min: -2.2, max: 15,
    redMin: -2.2, suggestionRed: '高寒限制，建议放弃或选用耐寒藻种。',
    suggestionYellow: '低温区，建议春季回暖后接种。',
    suggestionGreen: '气温适宜。'
  }));

  // 降水量季节性变化
  details.push(checkRange(params.precip_seasonality, {
    name: '降水量季节性变化', unit: 'mm',
    max: 126.6,
    redMin: undefined, redMax: 126.6,
    suggestionRed: '降水过于集中，建议放弃或增设草方格+保水剂。',
    suggestionYellow: '降水分配偏集中，建议增设保水措施。',
    suggestionGreen: '降水分配均匀，适合自然生长。'
  }));

  // 土壤全氮含量
  details.push(checkRange(params.soil_total_n, {
    name: '土壤全氮含量', unit: 'g/kg',
    min: 0, max: 2.58,
    redMin: undefined, redMax: 2.58,
    suggestionRed: '肥力过高，竞争激烈。建议先种消耗性先锋植物或物理剥离表土。',
    suggestionGreen: '贫氮沙土，适合结皮定殖。'
  }));

  // 土壤全磷含量
  details.push(checkRange(params.soil_total_p, {
    name: '土壤全磷含量', unit: 'g/kg',
    min: 0.38, max: 0.56,
    redMin: undefined, redMax: 0.56,
    suggestionRed: '磷过高抑制结皮，建议放弃或降磷处理。',
    suggestionYellow: '磷含量略低或略高，需关注但可尝试。',
    suggestionGreen: '磷含量正常，适宜区间。'
  }));

  // 土壤砾石含量
  details.push(checkRange(params.gravel_content, {
    name: '土壤砾石含量', unit: '%',
    min: 0, max: 7.3,
    redMin: undefined, redMax: 18.4,
    suggestionRed: '砾石过多，藻丝体难以附着。建议放弃或物理筛分整地。',
    suggestionYellow: '砾石含量偏高（7.3~18.4%），可正常结皮但需注意。',
    suggestionGreen: '砾石含量适宜。'
  }));

  // 海拔
  details.push(checkRange(params.elevation, {
    name: '海拔', unit: 'm',
    max: 3840,
    redMin: undefined, redMax: 3840,
    suggestionRed: '高海拔低温强辐射，建议放弃或仅选南坡向阳微生境。',
    suggestionGreen: '海拔适宜。'
  }));

  // 盐渍化（定性指标）
  const salinityCheck = checkSalinity(params.salinization);
  details.push(salinityCheck);

  // 大风日数
  details.push(checkRange(params.wind_days, {
    name: '大风日数', unit: 'd/年',
    max: 50,
    redMin: undefined, redMax: 50,
    suggestionRed: '持续强风导致结皮破碎剥离。建议配合高立式沙障+草方格防护。',
    suggestionGreen: '风蚀风险可控。'
  }));

  // 植被盖度
  details.push(checkRange(params.vegetation_cover, {
    name: '植被盖度', unit: '%',
    max: 40,
    redMin: undefined, redMax: 40,
    suggestionRed: '高等植物与结皮竞争，建议适当疏伐。',
    suggestionGreen: '利于结皮拓殖。'
  }));

  // 过滤null值
  const validDetails = details.filter(d => d !== null);

  // 统计超出阈值项数
  const failCount = validDetails.filter(d => d.level === 'red').length;
  const warnCount = validDetails.filter(d => d.level === 'yellow').length;

  // 综合判定
  let level, summary;
  if (failCount >= 3) {
    level = 'red';
    summary = '不推荐。' + failCount + '项指标超出非适生阈值，建议放弃或寻找微生境。';
  } else if (failCount >= 1 || warnCount >= 2) {
    level = 'yellow';
    summary = '有条件推荐。' + (failCount > 0 ? failCount + '项超出非适生阈值' : '') +
              (failCount > 0 && warnCount > 0 ? '，' : '') +
              (warnCount > 0 ? warnCount + '项需配套辅助措施' : '') + '。';
  } else {
    level = 'green';
    summary = '优先推荐。所有指标达标，适宜开展生物结皮固沙工程。';
  }

  return { level, failCount, warnCount, details: validDetails, summary };
}

function checkSalinity(value) {
  if (!value) return null;
  const v = String(value).trim();

  const redKeywords = ['盐壳区', '盐碱土重度', '重度盐碱', '盐碱土', '盐壳'];
  const yellowKeywords = ['轻度盐碱', '中度盐碱'];

  const isRed = redKeywords.some(k => v.includes(k));
  const isYellow = yellowKeywords.some(k => v.includes(k));

  if (isRed) {
    return {
      name: '盐渍化状况', value: v, unit: '',
      level: 'red',
      suggestion: '盐壳区直接判为非适生。盐碱土与适生区重叠仅5.47%，不建议在此类区域工程。若无可避让须先淡水洗盐排碱。'
    };
  }
  if (isYellow) {
    return {
      name: '盐渍化状况', value: v, unit: '',
      level: 'yellow',
      suggestion: '轻度盐碱，需配套洗盐排碱措施。'
    };
  }
  return {
    name: '盐渍化状况', value: v, unit: '',
    level: 'green',
    suggestion: '非盐渍化或正常，可正常开展。'
  };
}

// ---- 第二层：培育过程监测 ----

export function checkMonitorEnv(data) {
  const alerts = [];
  const addAlert = (r) => { if (r && r.level !== 'green') alerts.push(r); return r; };

  addAlert(checkRange(data.temp, {
    name: '培育温度', unit: 'C',
    min: 15, max: 30,
    redMin: undefined, redMax: 30, suggestionRed: '温度过高，遮阳+增加补水。',
    yellowMin: 15, suggestionYellow: '温度偏低，延长光照至12h/d补偿。'
  }));

  addAlert(checkRange(data.light_intensity, {
    name: '光照强度', unit: 'Lx',
    min: 2000, max: 12000,
    redMin: 2000, suggestionRedLow: '光照不足，补光或延长光照。',
    redMax: 12000, suggestionRedHigh: '光照过强，遮阳。'
  }));

  addAlert(checkRange(data.light_hours, {
    name: '光照时长', unit: 'h/d',
    min: 6, max: 12,
    redMin: 6, suggestionRed: '光照严重不足，延长至10~12h/d。'
  }));

  addAlert(checkRange(data.soil_water, {
    name: '土壤含水量', unit: '%',
    min: 8, max: 20,
    redMin: 8, suggestionRedLow: '严重缺水，立即补水。',
    redMax: 20, suggestionRedHigh: '含水量过高，减少施水量。',
    yellowMin: 10, suggestionYellow: '含水量偏低，增加补水频次。'
  }));

  addAlert(checkRange(data.humidity, {
    name: '空气相对湿度', unit: '%RH',
    min: 80, max: 90,
    yellowMin: 80, suggestionYellow: '湿度偏低，适当喷雾。'
  }));

  const activeAlerts = alerts.filter(a => a !== null);
  const maxLevel = activeAlerts.some(a => a.level === 'red') ? 'red' :
                   activeAlerts.some(a => a.level === 'yellow') ? 'yellow' : 'green';

  return { level: maxLevel, alerts: activeAlerts, summary: activeAlerts.length > 0 ? '存在异常指标需关注' : '所有环境指标正常' };
}

export function checkMonitorCrust(data) {
  const alerts = [];
  const addAlert = (r) => { if (r && r.level !== 'green') alerts.push(r); return r; };

  addAlert(checkRange(data.coverage, {
    name: '结皮盖度', unit: '%',
    min: 30, max: 80,
    redMin: 30, suggestionRedLow: '拓殖不良，检查水分/光照或补充BS菌剂。',
    redMax: 80, suggestionRedHigh: '盖度过高，成熟减少补水。'
  }));

  addAlert(checkRange(data.thickness, {
    name: '结皮厚度', unit: 'mm',
    min: 1.0, max: 4.0,
    redMin: 1.0, suggestionRed: '偏薄，增加菌剂。',
    yellowMin: 1.92, suggestionYellow: '厚度偏低，继续养护。'
  }));

  addAlert(checkRange(data.chl_a, {
    name: '生物量Chl-a', unit: 'ug/cm2',
    min: 0.10, max: null,
    redMin: 0.10, suggestionRed: '生长停滞，补充BS或检查光照。',
    yellowMin: 0.17, suggestionYellow: '生长偏慢，继续观察。'
  }));

  addAlert(checkRange(data.compressive_strength, {
    name: '抗压强度', unit: 'kg/cm2',
    min: 0.15, max: null,
    redMin: 0.15, suggestionRed: '结构松散，补充BS或BM。',
    yellowMin: 0.20, suggestionYellow: '中等硬度，继续养护。'
  }));

  addAlert(checkRange(data.wind_erosion_rate, {
    name: '风蚀率', unit: 'g/(m2·min)',
    min: 0, max: 1.0,
    redMin: undefined, redMax: 2.0, suggestionRed: '防风蚀效果差，首选BS菌剂。',
    yellowMin: undefined, yellowMax: 1.0, suggestionYellow: '中等，优化菌剂配比。'
  }));

  if (data.roughness) {
    const r = String(data.roughness);
    if (r.includes('光滑') || r.includes('平坦')) {
      alerts.push({ name: '表面粗糙度', value: r, unit: '', level: 'yellow',
        suggestion: '表面光滑未成型，补营养液。' });
    } else if (r.includes('龟裂') || r.includes('褶皱')) {
      alerts.push({ name: '表面粗糙度', value: r, unit: '', level: 'green',
        suggestion: '龟裂褶皱，结皮成熟。' });
    }
  }

  if (data.crust_color) {
    const c = String(data.crust_color);
    if (c.includes('发白') || c.includes('干裂')) {
      alerts.push({ name: '结皮颜色', value: c, unit: '', level: 'red',
        suggestion: '严重缺水，立即补水。' });
    } else if (c.includes('深绿') || c.includes('黑褐')) {
      alerts.push({ name: '结皮颜色', value: c, unit: '', level: 'green',
        suggestion: '结皮成熟，状态良好。' });
    }
  }

  const activeAlerts = alerts.filter(a => a !== null);
  const maxLevel = activeAlerts.some(a => a.level === 'red') ? 'red' :
                   activeAlerts.some(a => a.level === 'yellow') ? 'yellow' : 'green';

  return { level: maxLevel, alerts: activeAlerts, summary: activeAlerts.length > 0 ? '存在' + activeAlerts.length + '项指标需关注' : '结皮生长状态良好' };
}

export function checkMonitorSoil(data) {
  const alerts = [];
  const addAlert = (r) => { if (r && r.level !== 'green') alerts.push(r); return r; };

  addAlert(checkRange(data.organic_matter, {
    name: '土壤有机质', unit: 'g/kg',
    min: 8.0, max: null,
    redMin: 8.0, suggestionRed: '改良效果不明显，增加菌剂或延长培育周期。',
    yellowMin: 12.0, suggestionYellow: '中等改良效果。'
  }));

  addAlert(checkRange(data.total_n, {
    name: '土壤全氮(改良后)', unit: 'g/kg',
    min: 0.10, max: null,
    redMin: 0.10, suggestionRed: '固氮效果差，优先选用BM（胶质芽孢杆菌）。',
    yellowMin: 0.13, suggestionYellow: '固氮有一定效果。'
  }));

  addAlert(checkRange(data.ph, {
    name: '土壤pH', unit: '',
    min: 7.0, max: 8.5,
    redMin: 6.5, suggestionRedLow: '偏酸，加石膏中和。',
    redMax: 9.0, suggestionRedHigh: '偏碱，增施有机肥。'
  }));

  const activeAlerts = alerts.filter(a => a !== null);
  const maxLevel = activeAlerts.some(a => a.level === 'red') ? 'red' :
                   activeAlerts.some(a => a.level === 'yellow') ? 'yellow' : 'green';

  return { level: maxLevel, alerts: activeAlerts, summary: activeAlerts.length > 0 ? '存在养分指标需关注' : '土壤养分改良正常' };
}

export function checkMonitorCarbon(data) {
  const alerts = [];

  if (data.photosynthesis_rate !== null && data.photosynthesis_rate !== undefined && data.photosynthesis_rate !== '') {
    const v = parseFloat(data.photosynthesis_rate);
    if (!isNaN(v) && v < 0) {
      alerts.push({
        name: '净光合速率', value: v, unit: 'umol/(m2·s)', level: 'red',
        suggestion: '净光合为负值，需增加光照或检查藻类活性。'
      });
    }
  }

  if (data.soil_respiration !== null && data.soil_respiration !== undefined && data.soil_respiration !== '' &&
      data.photosynthesis_rate !== null && data.photosynthesis_rate !== undefined && data.photosynthesis_rate !== '') {
    const resp = parseFloat(data.soil_respiration);
    const photo = parseFloat(data.photosynthesis_rate);
    if (!isNaN(resp) && !isNaN(photo) && resp > photo && photo > 0) {
      alerts.push({
        name: '土壤呼吸速率', value: resp, unit: 'umol/(m2·s)', level: 'yellow',
        suggestion: '土壤呼吸显著高于光合，异养微生物过旺，减少补水或暂停营养液。'
      });
    }
  }

  const maxLevel = alerts.some(a => a.level === 'red') ? 'red' :
                   alerts.some(a => a.level === 'yellow') ? 'yellow' : 'green';

  return { level: maxLevel, alerts, summary: alerts.length > 0 ? '碳汇指标需关注' : '碳汇监测正常' };
}
