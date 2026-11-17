# FORGE Custom PC — CIS222 网站项目说明

本目录是 **FORGE Custom PC Ltd.**（香港定制电脑组装与硬件工程公司）完整前端与电商平台项目，包含 **24 个 HTML 页面**、53 款 2026 年主流硬件与定制改装配件、Blender Cycles 工作室渲染与 `.glb` 实机模型驱动的实时 3D 装机工作台（WebGL / Three.js）、全局购物车抽屉与 5 阶段订单追踪发票系统、以及 4 标签页员工后台管理控制台。

## 1. 快速运行方式

- **方式一（推荐本地 HTTP 服务）**：在项目根目录运行 `python3 -m http.server 8000`，浏览器访问 `http://localhost:8000/index.html`。
- **方式二（直接双击打开）**：所有 3D 模型（`models/pc_models_data.js`）、贴图与脚本均已完成本地内联与无跨域兼容处理，可直接双击 `index.html` 在浏览器中运行。

## 2. 核心亮点与 CIS222 标准逐项对应

1. **完整 24 页企业级电商架构**：
   - **首页与品牌展示**：`index.html`（交互式 3D 主机、配置轮播、Lab 帧率基准测试、4 步装机与 QC 流程、香港商业采购信息）、`about.html`（观塘/旺角设施与工程师翻转卡片）、`gallery.html`（Cycles 工作室渲染与实装对比画廊）、`news.html`（6 篇 2026 硬件深度评测报告弹窗阅读）、`sitemap.html`（全站 24 页树状导航地图）。
   - **核心 3D 装机与完整电商闭环**：`builder.html`（实时 3D 装机与拆解爆炸图、功耗/FPS 遥测、多配件同时加装）、`products.html`（全 53 款硬件与 10 款改装配件、Grid/Table 双视图、悬停实装效果图切换与加购）、`product-detail.html`（3D CAD 检视与装机预览）、`prebuilt.html`（4 套整机方案与横向对比表）、`services.html`（6 项工程服务与定价表，支持一键加购与预订）、`cart.html`（完整购物袋、配送方式切换与 `FORGE5` 优惠码）、`order-confirm.html`、`checkout-success.html`（目录价格完整性校验与防篡改告警）、`order-detail.html`（5 阶段实时装机追踪与可打印正式发票）。
   - **会员与员工双系统**：`register.html` → `register-result.html`（4 级密码强度计、URL 密码隔离与 `FG-MBR-` 会员编号生成）、`login.html`（客户登录 `demo@forge.hk` / `Forge2026`；员工登录 `staff01` / `Admin@2026`，支持 `?role=staff` 自动切换、一键演示填充与 3 次错误 30 秒锁定）、`member-dashboard.html`（会员折扣权益卡、已保存 3D 方案加载/加购、实时订单状态与追踪入口）、`staff-dashboard.html`（4 标签页员工后台：总览与观塘烤机架监控、订单履行 5 阶段实时流转、53 件库存分类筛选与 `-1/+1/+10` 补货、客服工单状态切换与评论审核）。
   - **客户支持与反馈表单**：`contact.html`（旺角信和中心展厅与观塘工业中心实验室地址、地图与营业时间）、`inquiry.html`、`comment.html`、`complaint.html`（支持 `?order=FG-...` 自动回填订单号）、`faq.html`（分类筛选与关键词实时搜索）。
2. **Blender `.glb` 3D 模型库 + Cycles 工作室渲染 + WebGL PMREM 光照升级**：
   - 基于 Blender 构建高精度 `.glb` 硬件模型库并内联导出至 `models/pc_models_data.js`，在 `js/pc3d.js` 中结合 `THREE.PMREMGenerator` 工作室环境反射与 ACES Filmic 色调映射，呈现真实钛金属质感与零穿模空间布局。
   - 同时配备 4 张高分辨率 Cycles 渲染图（`hero_rig_studio.png`、`gpu_macro.png`、`exploded_blueprint.png`、`showroom_bench.png`）与全部 53 款独立产品/实装图（`img/products/`、`img/installed/`）。
3. **Pure Carbon 纯碳黑工业设计系统与微交互体验**：
   - 采用 Pure Carbon 中性碳黑层级（`#0A0A0A` / `#121212` / `#161616` / `#1F1F1F`），搭配暖钛金（`#E5A93C`）、翡翠绿（`#10B981`）与信号橙（`#FF7A17`）主题联动，零紫色/靛蓝色值。
   - 配备全局 `Cmd+K` / `Ctrl+K` 键盘检索（支持上下方向键导航）、滚动进度条、标签联动、悬停切图及可开关的 Web Audio 机械反馈音效。
