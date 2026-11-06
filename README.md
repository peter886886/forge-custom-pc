# FORGE — Custom PC & 3D Configurator

> Flagship custom PC studio and interactive real-time 3D configurator website built with Three.js / WebGL.

🌐 **Live Demo (GitHub Pages):** [https://peter886886.github.io/forge-custom-pc/](https://peter886886.github.io/forge-custom-pc/)  
📦 **Repository:** [https://github.com/peter886886/forge-custom-pc](https://github.com/peter886886/forge-custom-pc)

---

## 🌟 Key Features

1. **Interactive Real-Time 3D PC Builder (`builder.html`)**
   - High-fidelity WebGL / Three.js 3D PC assembly stage.
   - 360° turntable orbit, zoom, pan, and exploded assembly view (`Explode`).
   - Thermal airflow simulation (`Airflow`), side glass toggle (`Glass`), auto-rotation (`Spin`), and screenshot capture (`Snapshot`).
   - Dynamic real-time wattage calculation, 3DMark score estimation, and 1080p / 1440p / 4K gaming FPS telemetry.
   - Full compatibility rules: CPU socket matching, cooler clearance, PSU headroom, and multi-accessory add-on installation.

2. **Full Hardware Catalog & Modding Accessories (`products.html` & `product-detail.html`)**
   - 53 authentic 2026 hardware modules across 8 categories (Processors, Motherboards, Memory, Graphics Cards, Storage, Power Supplies, CPU Coolers, and Panoramic Chassis).
   - 10 custom modding & telemetry modules (braided 12V-2x6 cable kits, CNC anti-sag brackets, 5.0" IPS telemetry screens, daisy-chain LCD fans, and contact frames).
   - Mouse hover instant switch between studio product photography and installed-in-PC chassis views.
   - Individual 3D model viewer and live 3D chassis fitment inspection on every product detail page.

3. **Complete 22-Page Enterprise Web Architecture**
   - **Showcase & Discovery:** Home (`index.html`), About Us (`about.html`), Studio Gallery (`gallery.html`), Prebuilt Systems (`prebuilt.html`), Engineering Services (`services.html`), Build Guides & Reviews (`news.html`), and Sitemap (`sitemap.html`).
   - **E-Commerce Flow:** Shopping Cart / Order Review (`order-confirm.html`), Checkout Confirmation (`checkout-success.html`).
   - **Customer & Staff Portals:** Member Registration & Dashboard (`register.html`, `member-dashboard.html`), Staff Admin Panel (`staff-dashboard.html`, `login.html`).
   - **Customer Support:** Contact Us with Showroom Map (`contact.html`), General Inquiries (`inquiry.html`), User Comments Wall (`comment.html`), Complaints & Feedback (`complaint.html`), and Interactive FAQ (`faq.html`).

4. **Engineered Aesthetics & Performance**
   - Pure carbon dark mode design system (`#0A0A0A` / `#121212` / `#161616` / `#1F1F1F`) inspired by modern industrial engineering.
   - Zero external framework dependencies; pure HTML5, CSS3, vanilla JavaScript, and Three.js.
   - Keyboard command palette (`Cmd+K` / `Ctrl+K`), custom audio feedback toggle, and responsive mobile adaptation.

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

Academic and demonstration project. All product specifications, brand names, and trademarks belong to their respective owners.
