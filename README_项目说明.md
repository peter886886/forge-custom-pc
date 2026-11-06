# FORGE Custom PC — CIS222 / CIS282 网站项目说明

本目录是 **FORGE Custom PC Ltd.**（定制电脑组装与硬件工程公司）完整前端项目，包含 **22 个 HTML 页面**、53 款 2026 年主流硬件与定制改装配件、无穿模实时 3D 装机工作台（WebGL / Three.js）、单品 3D CAD 检视器以及整机实装效果图预览系统。

## 1. 快速运行方式

- **方式一（推荐本地 HTTP 服务）**：在项目根目录运行 `python3 -m http.server 8000`，浏览器访问 `http://localhost:8000/index.html`。
- **方式二（直接双击打开）**：所有 3D 模型、贴图与脚本均已完成本地内联与无跨域兼容处理，可直接双击 `index.html` 在浏览器中运行。

## 2. 核心亮点与 CIS222 / CIS282 评分标准逐项对应

1. **完整 22 页企业级网站架构（远超至少 10 页要求）**：
   - **首页与品牌展示**：`index.html`（交互式 3D 主机、配置轮播、品牌跑马灯、客户评价）、`about.html`（发展时间轴、3D 翻转工程师卡片）、`gallery.html`（工作室渲染与实装对比画廊）、`news.html`（6 篇 2026 硬件深度评测报告弹窗阅读）、`sitemap.html`（全站树状导航地图）。
   - **核心 3D 装机与商城闭环**：`builder.html`（实时 3D 装机与拆解爆炸图、功耗/FPS 遥测、多配件同时加装）、`products.html`（全 53 款硬件与 10 款改装配件、Grid/Table 双视图、悬停实装效果图切换、3D/效果图快速弹窗）、`product-detail.html`（三合一视图：`🌐 3D Component CAD`、`🖥️ Installed in PC Effect 整机实装效果图`、`📷 Studio & Effect Gallery`）、`prebuilt.html`（4 套整机方案与横向对比表）、`services.html`（6 项工程服务与定价表，支持一键预订跳转确认页）、`order-confirm.html`、`checkout-success.html`。
   - **会员与员工双系统**：`register.html` → `register-result.html`（注册信息跨页表格展示）、`login.html`（客户登录 `demo@forge.hk` / `Forge2026`；员工登录 `staff01` / `Admin@2026`）、`member-dashboard.html`、`staff-dashboard.html`。
   - **客户支持与反馈表单**：`contact.html`（香港观塘展厅地图与营业时间）、`inquiry.html` → `inquiry-result.html`、`comment.html` → `comment-wall.html`、`complaint.html` → `complaint-result.html`、`faq.html`（手风琴折叠问答）。
2. **零穿模 3D 装机与 53 款独立硬件模型 + 实装效果图**：
   - 重新校准了机箱、主板、双塔风冷/360 水冷、四通道内存、三风扇显卡、电源仓与全部 10 款改装配件（编织线梳套件、底部 LCD 联排风扇、导热硅脂、CNC 显卡支架、竖装延长线、5 寸 IPS 副屏、iCUE 集线器、CPU 防弯扣具、猫头鹰风扇、磁吸防尘网）的三维空间坐标，彻底消除线材穿显卡、风冷穿内存及配件重叠问题。
   - 商城内每一款商品均配备独立高清产品图（`img/products/`）、整机实装效果图（`img/installed/`）、专属 3D 模型与实时 3D 装机聚焦预览。
3. **成熟高科技配色（Aerospace Titanium & Glacier Telemetry）与流畅滚动动效**：
   - 采用深曜石碳黑（`#060911`）、CNC 钛灰面板（`#101726`）、冰川青遥测主色（`#38BDF8`）、香槟金点缀（`#F59E0B`）与双倒角高光边框（Double-Bezel），零廉价紫色。
   - 配备页面顶部滚动进度条、视口交错浮现动画（Staggered Scroll Reveal）、卡片鼠标聚光灯与 3D 微倾视差、悬停图片平滑切换（Mouseover Image Swap）及可开关的 Web Audio 机械交互音效。
