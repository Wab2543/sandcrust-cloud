# 沙结智汇云 — Sand Crust Smart Cloud

基于AIoT的生物结皮荒漠治理与碳汇管理数字化平台

## 项目简介

针对我国荒漠化治理中"测不准、判不快、调不精"的困境，本平台立足现有荒漠信息管理体系，构建"数据采集—智能分析—策略推送"的信息化闭环，为生物结皮治沙的精准调控与规模化推广提供数据支撑。

### 核心功能

- **第一层：场地适宜性评估** — 10项环境因子综合判定，红黄绿三色分级
- **第二层：培育过程监测** — 五大模块（环境/结皮/土壤/操作/碳汇）精细化管控
- **规则引擎** — 基于科研文献（462个分布点Biomod2模型）的关键阈值自动判定
- **数据可视化** — 监测趋势图、仪表盘统计、预警高亮
- **响应式设计** — 手机/平板/桌面自适应

## 技术栈

- 前端: HTML + CSS + JavaScript + Chart.js
- 后端: Cloudflare Workers
- 数据库: Cloudflare D1 (SQLite)
- 部署: Cloudflare Pages + GitHub Actions

## 本地运行

```bash
# 安装依赖
npm install

# 启动本地开发服务器
wrangler dev

# 浏览器访问
# http://localhost:8787
```

## 项目结构

```
sandcrust-cloud/
├── public/              前端静态文件
│   ├── index.html       首页仪表盘
│   ├── assess.html      第一层：选址评估
│   ├── monitor.html     第二层：培育监测
│   ├── history.html     历史数据查询
│   ├── knowledge.html   知识库/阈值速查
│   ├── css/style.css    全局样式
│   └── js/              JavaScript模块
├── src/                 后端Worker
│   ├── worker.js        主入口+路由
│   ├── engine.js        规则引擎
│   ├── db.js            数据库操作
│   └── validate.js      数据校验
├── schema.sql           数据库建表
├── seed.sql             阈值初始数据
├── wrangler.toml        部署配置
└── package.json         项目配置
```

## 部署

```bash
# 部署Worker
wrangler deploy

# 初始化数据库
wrangler d1 execute sandcrust-db --file=schema.sql
wrangler d1 execute sandcrust-db --file=seed.sql

# 部署前端
wrangler pages deploy public --project-name=sandcrust-cloud
```

## 数据来源

- 张鑫钰等. 中国旱区生物土壤结皮分布格局及限制因素. 生态学报, 2026, 46(10): 5559-5570.
- 康红梅等. 一种蓝藻、沙蒿胶及微生物菌剂联合固沙新方法研究. 环境生态学, 2025, 7(9): 153-157.
