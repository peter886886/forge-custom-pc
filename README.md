# FORGE — Custom PC & 3D Configurator

> Flagship custom PC studio, e-commerce storefront, and interactive real-time 3D configurator website built with Three.js / WebGL and Blender Cycles studio assets.

🌐 **Live Demo (GitHub Pages):** [https://peter886886.github.io/forge-custom-pc/](https://peter886886.github.io/forge-custom-pc/)  
📦 **Repository:** [https://github.com/peter886886/forge-custom-pc](https://github.com/peter886886/forge-custom-pc)

---

## 🌟 Key Features

1. **Interactive Real-Time 3D PC Builder (`builder.html`)**
   - High-fidelity WebGL / Three.js 3D PC assembly stage backed by Blender `.glb` hardware models and PMREM studio lighting.
   - 360° turntable orbit, zoom, pan, and exploded assembly view (`Explode`).
   - Thermal airflow simulation (`Airflow`), side glass toggle (`Glass`), auto-rotation (`Spin`), and screenshot capture (`Snapshot`).
   - Dynamic real-time wattage calculation, 3DMark score estimation, and 1080p / 1440p / 4K gaming FPS telemetry.
   - Full compatibility rules: CPU socket matching (`LGA1851` / `AM5` / `LGA1700`), cooler clearance, PSU headroom, and multi-accessory add-on installation.

2. **Full Hardware Catalog & Modding Accessories (`products.html` & `product-detail.html`)**
   - 53 authentic 2026 hardware modules across 9 categories (43 core components across 8 categories + 10 modding & telemetry accessories).
   - 4 flagship prebuilt reference systems (`prebuilt.html`) with live side-by-side comparison and direct `Add to Bag` support.
   - Mouse hover instant switch between studio product photography and installed-in-PC chassis views, plus interactive 3D CAD modal and fitment inspection.

3. **Complete 24-Page E-Commerce & Operations Architecture**
   - **Showcase & Discovery:** Home (`index.html`), About Us (`about.html`), Studio Gallery (`gallery.html`), Prebuilt Systems (`prebuilt.html`), Engineering Services (`services.html`), Build Guides & Lab Reports (`news.html`), and 24-page Sitemap (`sitemap.html`).
   - **E-Commerce Cart, Checkout & Order Tracking:** Global slide-out Bag drawer + full Shopping Bag (`cart.html`), Order Review & Catalog Integrity Checkout (`order-confirm.html`, `checkout-success.html`), and 5-Stage Live Order Tracking & Printable Invoice (`order-detail.html`).
   - **Customer & Staff Portals:** Member Registration & Benefit Dashboard (`register.html`, `register-result.html`, `member-dashboard.html`), Dual-Role Login with 3-attempt lockout (`login.html`), and 4-Tab Staff Operations Console covering Burn-In Rack Telemetry, Order Fulfillment Stages, 53-SKU Stock Management, and Ticket/Review Moderation (`staff-dashboard.html`).
   - **Customer Support:** Contact Us with Showroom Map (`contact.html`), General Inquiries (`inquiry.html`), Customer Comments Wall (`comment.html`), Complaints & Order Issue Reporting (`complaint.html`), and Searchable FAQ (`faq.html`).

4. **Engineered Aesthetics & Performance**
   - Pure Carbon dark mode design system (`#0A0A0A` / `#121212` / `#161616` / `#1F1F1F`) with Warm Gold (`#E5A93C`), Emerald (`#10B981`), and Signal Orange (`#FF7A17`) accents.
   - Zero external framework dependencies; pure HTML5, CSS3, vanilla JavaScript, and Three.js (`GLTFLoader`).
   - Keyboard command palette (`Cmd+K` / `Ctrl+K`), Web Audio tactile feedback toggle, and responsive mobile adaptation.

---

## 🚀 Local Run

Simply open `index.html` in any modern web browser, or serve locally with Python:

```bash
cd forge
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

---

## 📄 License

Academic and demonstration project (CIS222). All product specifications, brand names, and trademarks belong to their respective owners.
