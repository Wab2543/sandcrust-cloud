// 沙结智汇云 数据校验模块

export function validateAssess(data) {
  const errors = [];

  if (!data.project_id) errors.push('缺少项目ID');

  const required = [
    { key: 'annual_precip', name: '年降水量' },
    { key: 'annual_temp', name: '年平均气温' },
    { key: 'precip_seasonality', name: '降水量季节性变化' },
    { key: 'soil_total_n', name: '土壤全氮含量' },
    { key: 'soil_total_p', name: '土壤全磷含量' },
    { key: 'gravel_content', name: '土壤砾石含量' },
    { key: 'elevation', name: '海拔' },
    { key: 'salinization', name: '盐渍化状况' },
    { key: 'wind_days', name: '大风日数' },
    { key: 'vegetation_cover', name: '植被盖度' }
  ];

  for (const r of required) {
    if (data[r.key] === undefined || data[r.key] === null || data[r.key] === '') {
      // 盐渍化为可选定性字段
      if (r.key === 'salinization') continue;
      errors.push('缺少' + r.name);
    }
  }

  return errors;
}

export function validateMonitor(data) {
  const errors = [];

  if (!data.project_id) errors.push('缺少项目ID');
  if (!data.module) errors.push('缺少监测模块(module)');

  const module = data.module;
  const fieldMap = {
    env: [
      { key: 'temp', name: '培育温度' },
      { key: 'light_intensity', name: '光照强度' },
      { key: 'light_hours', name: '光照时长' },
      { key: 'soil_water', name: '土壤含水量' },
      { key: 'humidity', name: '空气相对湿度' }
    ],
    crust: [
      { key: 'coverage', name: '结皮盖度' },
      { key: 'thickness', name: '结皮厚度' },
      { key: 'chl_a', name: '生物量Chl-a' },
      { key: 'compressive_strength', name: '抗压强度' },
      { key: 'wind_erosion_rate', name: '风蚀率' }
    ],
    soil: [
      { key: 'organic_matter', name: '土壤有机质' },
      { key: 'total_n', name: '土壤全氮' },
      { key: 'ph', name: '土壤pH' }
    ],
    ops: [
      { key: 'algae_ratio', name: '藻种配比' },
      { key: 'bacteria_type', name: '菌剂类型' }
    ],
    carbon: [
      { key: 'photosynthesis_rate', name: '净光合速率' }
    ]
  };

  const fields = fieldMap[module];
  if (!fields) {
    errors.push('未知监测模块: ' + module);
    return errors;
  }

  for (const f of fields) {
    if (data[f.key] === undefined || data[f.key] === null || data[f.key] === '') {
      errors.push('缺少' + f.name);
    }
  }

  return errors;
}
