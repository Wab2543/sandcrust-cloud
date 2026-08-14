// 沙结智汇云 Chart.js 图表组件

async function renderDashboardChart(containerId, projectId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const r = await apiGet('/monitor?project_id=' + projectId + '&module=all');
    const data = r.data;

    // 收集监测数据用于图表
    const labels = [];
    const envTemp = [];
    const crustThick = [];
    const soilOM = [];

    const envRecords = (data.env || []).reverse();
    const crustRecords = (data.crust || []).reverse();
    const soilRecords = (data.soil || []).reverse();

    const maxLen = Math.max(envRecords.length, crustRecords.length, soilRecords.length);

    for (let i = 0; i < maxLen; i++) {
      labels.push('#' + (i + 1));
      if (envRecords[i]) envTemp.push(envRecords[i].temp);
      if (crustRecords[i]) crustThick.push(crustRecords[i].thickness);
      if (soilRecords[i]) soilOM.push(soilRecords[i].organic_matter);
    }

    const datasets = [];
    if (envTemp.length > 0) {
      datasets.push({
        label: '培育温度 (C)',
        data: envTemp,
        borderColor: '#E37400',
        backgroundColor: 'rgba(227,116,0,0.1)',
        tension: 0.3
      });
    }
    if (crustThick.length > 0) {
      datasets.push({
        label: '结皮厚度 (mm)',
        data: crustThick,
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46,139,87,0.1)',
        tension: 0.3
      });
    }
    if (soilOM.length > 0) {
      datasets.push({
        label: '土壤有机质 (g/kg)',
        data: soilOM,
        borderColor: '#1A73E8',
        backgroundColor: 'rgba(26,115,232,0.1)',
        tension: 0.3
      });
    }

    new Chart(container, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: '数值' }
          },
          x: {
            title: { display: true, text: '监测次数' }
          }
        }
      }
    });
  } catch (e) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">-</div><p>暂无数据</p></div>';
  }
}
