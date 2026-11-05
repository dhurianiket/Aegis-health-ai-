#!/usr/bin/env python3
"""
Aegis Health AI — NVIDIA Inception LinkedIn Banner Generator
Generates pixel-perfect 1200x675 and 2400x1350 (2x Retina) announcement banners.
"""
import subprocess
import os
import base64
from PIL import Image

def generate_banners():
    svg_path = "/Users/chate/Downloads/Inception Badges/for-screen/nvidia-inception-program-badge-rgb-for-screen.svg"
    if not os.path.exists(svg_path):
        svg_path = "/Volumes/DEOYANI SSD/antigravity workspace /aniket /Aegis-health-ai-/public/nvidia-inception-badge.svg"
    
    with open(svg_path, 'r', encoding='utf-8') as f:
        svg_raw = f.read()

    svg_b64 = base64.b64encode(svg_raw.encode('utf-8')).decode('utf-8')
    svg_data_uri = f"data:image/svg+xml;base64,{svg_b64}"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }}
  
  body {{
    width: 1200px;
    height: 675px;
    background-color: #040911;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Inter", "Segoe UI", Roboto, sans-serif;
    color: #FFFFFF;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }}

  /* Ambient radial glows */
  .glow-nvidia {{
    position: absolute;
    top: -140px;
    right: -40px;
    width: 700px;
    height: 600px;
    background: radial-gradient(circle, rgba(118, 185, 0, 0.28) 0%, rgba(118, 185, 0, 0.08) 45%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }}

  .glow-teal {{
    position: absolute;
    top: -100px;
    left: -40px;
    width: 650px;
    height: 550px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }}

  .glow-center {{
    position: absolute;
    bottom: -180px;
    left: 280px;
    width: 650px;
    height: 450px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }}

  /* High-tech grid background */
  .grid-pattern {{
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 38px 38px;
    mask-image: radial-gradient(ellipse at 50% 45%, black 45%, transparent 82%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 45%, black 45%, transparent 82%);
    z-index: 2;
    pointer-events: none;
  }}

  /* Main Card Frame */
  .banner-container {{
    position: relative;
    z-index: 3;
    width: 1140px;
    height: 615px;
    background: rgba(8, 20, 38, 0.72);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 24px;
    padding: 30px 42px 26px 42px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 
      0 30px 70px -15px rgba(0, 0, 0, 0.85),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      inset 0 0 50px rgba(118, 185, 0, 0.04);
  }}

  /* Top Navigation Bar */
  .top-bar {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }}

  .brand-lockup {{
    display: flex;
    align-items: center;
    gap: 15px;
  }}

  .shield-icon-box {{
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.12) 100%);
    border: 1.5px solid rgba(16, 185, 129, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 25px rgba(16, 185, 129, 0.3);
  }}

  .shield-svg {{
    width: 26px;
    height: 26px;
    color: #34D399;
  }}

  .brand-text-col {{
    display: flex;
    flex-direction: column;
    gap: 3px;
  }}

  .brand-name-row {{
    display: flex;
    align-items: center;
    gap: 10px;
  }}

  .brand-name {{
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 0.16em;
    color: #FFFFFF;
  }}

  .brand-tag-health {{
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: #34D399;
    padding-left: 10px;
    border-left: 2px solid rgba(255, 255, 255, 0.2);
  }}

  .brand-descriptor {{
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: #94A3B8;
    text-transform: uppercase;
  }}

  /* Official NVIDIA Inception Card (Prominent & Guideline Compliant) */
  .nvidia-badge-card {{
    background: #FFFFFF;
    border-radius: 12px;
    padding: 7px 18px 7px 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 
      0 12px 35px -5px rgba(118, 185, 0, 0.45),
      0 0 0 1.5px rgba(118, 185, 0, 0.55),
      0 2px 6px rgba(0, 0, 0, 0.1);
  }}

  .nvidia-badge-img {{
    height: 48px;
    width: auto;
    display: block;
  }}

  /* Center Announcement Body */
  .announcement-body {{
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 6px;
  }}

  .milestone-pill-row {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}

  .milestone-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 9999px;
    background: rgba(118, 185, 0, 0.14);
    border: 1px solid rgba(118, 185, 0, 0.5);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    color: #A3E635;
    text-transform: uppercase;
    box-shadow: 0 0 22px rgba(118, 185, 0, 0.22);
  }}

  .pulsing-dot {{
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #76B900;
    box-shadow: 0 0 12px #76B900;
  }}

  .live-badge {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #34D399;
    text-transform: uppercase;
  }}

  .headline {{
    font-size: 45px;
    font-weight: 900;
    line-height: 1.14;
    letter-spacing: -0.025em;
    color: #FFFFFF;
  }}

  .headline-gradient {{
    background: linear-gradient(90deg, #76B900 0%, #9EE816 45%, #00F5A0 90%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 30px rgba(118, 185, 0, 0.4));
  }}

  .subheadline {{
    font-size: 16.5px;
    line-height: 1.48;
    color: #CBD5E1;
    max-width: 990px;
    font-weight: 400;
  }}

  /* Value Pillars 4-Card Bento Row */
  .bento-row {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-top: 4px;
  }}

  .bento-card {{
    background: linear-gradient(180deg, rgba(16, 36, 68, 0.65) 0%, rgba(9, 22, 44, 0.75) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 15px 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  }}

  .bento-card::before {{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1.5px;
    background: linear-gradient(90deg, transparent, rgba(118, 185, 0, 0.6), transparent);
  }}

  .card-header {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}

  .card-icon {{
    font-size: 15px;
  }}

  .card-tag {{
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #86EFAC;
  }}

  .card-title {{
    font-size: 14px;
    font-weight: 800;
    color: #F8FAFC;
    line-height: 1.25;
  }}

  .card-desc {{
    font-size: 11.5px;
    color: #94A3B8;
    line-height: 1.35;
  }}

  /* Bottom Verification & Legal Bar */
  .bottom-bar {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
  }}

  .founder-tag {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}

  .founder-name {{
    font-size: 12.5px;
    font-weight: 700;
    color: #F1F5F9;
  }}

  .founder-role {{
    font-size: 11.5px;
    color: #94A3B8;
  }}

  .founder-location {{
    font-size: 11.5px;
    color: #34D399;
    font-weight: 600;
  }}

  .url-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 18px;
    border-radius: 9999px;
    background: rgba(16, 185, 129, 0.14);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34D399;
    font-size: 12.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }}

  .legal-note {{
    font-size: 10px;
    color: #94A3B8;
    text-align: right;
    line-height: 1.4;
  }}
</style>
</head>
<body>

  <!-- Ambient Glows -->
  <div class="glow-nvidia"></div>
  <div class="glow-teal"></div>
  <div class="glow-center"></div>

  <!-- Background Grid -->
  <div class="grid-pattern"></div>

  <!-- Main Tech Card Container -->
  <div class="banner-container">
    
    <!-- Top Bar -->
    <div class="top-bar">
      <!-- Aegis Brand Lockup -->
      <div class="brand-lockup">
        <div class="shield-icon-box">
          <svg class="shield-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="brand-text-col">
          <div class="brand-name-row">
            <span class="brand-name">AEGIS</span>
            <span class="brand-tag-health">HEALTH AI</span>
          </div>
          <span class="brand-descriptor">Clinical Multimodal Intelligence • Indian Health Architecture</span>
        </div>
      </div>

      <!-- NVIDIA Inception Official Badge (White Card Preserving Guidelines) -->
      <div class="nvidia-badge-card">
        <img class="nvidia-badge-img" src="{svg_data_uri}" alt="Member of NVIDIA Inception Program" />
      </div>
    </div>

    <!-- Center Announcement Body -->
    <div class="announcement-body">
      <!-- Chips -->
      <div class="milestone-pill-row">
        <div class="milestone-pill">
          <div class="pulsing-dot"></div>
          <span>OFFICIAL ANNOUNCEMENT • STARTUP ACCELERATION</span>
        </div>
        <div class="live-badge">
          <span>ABDM M1-M3 HIU READY • FHIR R4</span>
        </div>
      </div>

      <!-- Main Title -->
      <h1 class="headline">
        Aegis Health AI Joins <span class="headline-gradient">NVIDIA Inception</span>
      </h1>

      <!-- Subtitle -->
      <p class="subheadline">
        Accelerating clinical multimodal intelligence, high-accuracy Indian diagnostic lab OCR, and longitudinal biomarker trajectory modeling with NVIDIA GPU compute, BioNeMo & NIM microservices.
      </p>
    </div>

    <!-- 4 Bento Cards -->
    <div class="bento-row">
      <div class="bento-card">
        <div class="card-header">
          <span class="card-icon">⚡</span>
          <span class="card-tag">NVIDIA Compute</span>
        </div>
        <div class="card-title">BioNeMo & NIM Inference</div>
        <div class="card-desc">Sub-second multimodal vision OCR & structured clinical reasoning</div>
      </div>

      <div class="bento-card">
        <div class="card-header">
          <span class="card-icon">🧬</span>
          <span class="card-tag">Biomarker Core</span>
        </div>
        <div class="card-title">Longitudinal Telemetry</div>
        <div class="card-desc">50+ normalized lab biomarkers across 120+ Indian pathology formats</div>
      </div>

      <div class="bento-card">
        <div class="card-header">
          <span class="card-icon">🛡️</span>
          <span class="card-tag">Data Governance</span>
        </div>
        <div class="card-title">DPDP Act & Zero-Trust</div>
        <div class="card-desc">Client-side zero-knowledge encrypted vault & physician SBAR handoffs</div>
      </div>

      <div class="bento-card">
        <div class="card-header">
          <span class="card-icon">🇮🇳</span>
          <span class="card-tag">Verified Startup</span>
        </div>
        <div class="card-title">Govt. MSME Registered</div>
        <div class="card-desc">UDYAM-MH-33-0782403 • Scaled for India's 1.4B healthcare ecosystem</div>
      </div>
    </div>

    <!-- Bottom Verification & Attribution -->
    <div class="bottom-bar">
      <div class="founder-tag">
        <span class="founder-name">Aniket Rajesh Dhuri</span>
        <span class="founder-role">• Founder & Lead Architect</span>
        <span class="founder-location">• Mumbai, India</span>
      </div>

      <div class="url-pill">
        <span>🌐 aegishealthai.co.in</span>
      </div>

      <div class="legal-note">
        Member of the NVIDIA Inception Program.<br>
        NVIDIA, the NVIDIA logo, and Inception are trademarks of NVIDIA Corporation.
      </div>
    </div>

  </div>

</body>
</html>
"""
    tmp_html = "/tmp/aegis_nvidia_banner_final.html"
    with open(tmp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    # Destinations
    repo_public = "/Volumes/DEOYANI SSD/antigravity workspace /aniket /Aegis-health-ai-/public"
    desktop = "/Users/chate/Desktop"
    
    out_std_repo = os.path.join(repo_public, "aegis-nvidia-inception-linkedin-banner.png")
    out_2x_repo = os.path.join(repo_public, "aegis-nvidia-inception-linkedin-banner-2x.png")
    out_std_desktop = os.path.join(desktop, "Aegis_NVIDIA_Inception_LinkedIn_Banner.png")
    out_2x_desktop = os.path.join(desktop, "Aegis_NVIDIA_Inception_LinkedIn_Banner_Retina2x.png")

    # Render standard 1200x675
    cmd_std = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1200,675",
        f"--screenshot={out_std_repo}",
        tmp_html
    ]
    subprocess.run(cmd_std, check=True)

    # Render 2x Retina 2400x1350
    cmd_2x = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=2",
        "--window-size=1200,675",
        f"--screenshot={out_2x_repo}",
        tmp_html
    ]
    subprocess.run(cmd_2x, check=True)

    # Copy to Desktop
    import shutil
    shutil.copy2(out_std_repo, out_std_desktop)
    shutil.copy2(out_2x_repo, out_2x_desktop)

    im1 = Image.open(out_std_repo)
    im2 = Image.open(out_2x_repo)
    print(f"Generated 1x Banner: {im1.size} -> {out_std_repo} & {out_std_desktop}")
    print(f"Generated 2x Retina Banner: {im2.size} -> {out_2x_repo} & {out_2x_desktop}")

if __name__ == "__main__":
    generate_banners()
