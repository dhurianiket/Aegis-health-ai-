#!/usr/bin/env python3
"""
Aegis Health AI — Social Launch Poster Generator
Renders studio-grade 1080x1350 (Instagram 4:5 Portrait) and 1200x630 (Facebook Landscape) posters.
"""
import os
import subprocess
import base64
from PIL import Image

def get_base64_img(file_path):
    if not os.path.exists(file_path):
        return ""
    with open(file_path, "rb") as f:
        data = f.read()
    ext = os.path.splitext(file_path)[1].lower()
    mime = "image/png"
    if ext == ".svg":
        mime = "image/svg+xml"
    elif ext in [".jpg", ".jpeg"]:
        mime = "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(data).decode('utf-8')}"

def render_posters():
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(workspace_dir, "public")
    
    logo_path = os.path.join(public_dir, "aegis-logo-transparent.png")
    nvidia_badge_path = os.path.join(public_dir, "nvidia-inception-badge.svg")
    nvidia_badge_png = os.path.join(public_dir, "nvidia-inception-badge.png")
    
    logo_b64 = get_base64_img(logo_path)
    nvidia_b64 = get_base64_img(nvidia_badge_path) or get_base64_img(nvidia_badge_png)

    # ==========================================
    # 1. INSTAGRAM PORTRAIT POSTER (1080x1350)
    # ==========================================
    html_portrait = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
  }}
  body {{
    width: 1080px;
    height: 1350px;
    background-color: #030712;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Inter", sans-serif;
    color: #F8FAFC;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 64px 56px 56px 56px;
  }}

  /* High-Tech Background Glows & Grid */
  .grid-pattern {{
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }}
  .glow-top-right {{
    position: absolute;
    top: -120px;
    right: -100px;
    width: 750px;
    height: 750px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.08) 45%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }}
  .glow-bottom-left {{
    position: absolute;
    bottom: -150px;
    left: -120px;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(118, 185, 0, 0.18) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }}
  .glow-center {{
    position: absolute;
    top: 320px;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 65%);
    pointer-events: none;
    z-index: 1;
  }}

  /* Content Containers */
  .header, .hero, .bento-section, .footer {{
    position: relative;
    z-index: 10;
  }}

  /* Header Bar */
  .header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .brand-group {{
    display: flex;
    align-items: center;
    gap: 16px;
  }}
  .brand-logo {{
    width: 52px;
    height: 52px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.6));
  }}
  .brand-text-col {{
    display: flex;
    flex-direction: column;
  }}
  .brand-name {{
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #FFFFFF;
    text-transform: uppercase;
  }}
  .brand-tagline {{
    font-size: 13px;
    font-weight: 500;
    color: #10B981;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }}
  .partner-badge {{
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(118, 185, 0, 0.35);
    padding: 8px 18px;
    border-radius: 9999px;
    backdrop-filter: blur(12px);
  }}
  .nvidia-logo {{
    height: 28px;
    width: auto;
    object-fit: contain;
  }}
  .partner-text {{
    font-size: 13px;
    font-weight: 600;
    color: #A3E635;
    letter-spacing: 0.03em;
  }}

  /* Hero Section */
  .hero {{
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: 10px;
  }}
  .status-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    padding: 7px 18px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #34D399;
    text-transform: uppercase;
    margin-bottom: 24px;
  }}
  .pulse-dot {{
    width: 8px;
    height: 8px;
    background-color: #10B981;
    border-radius: 50%;
    box-shadow: 0 0 10px #10B981;
  }}
  .hero-title {{
    font-size: 52px;
    font-weight: 850;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #FFFFFF;
    margin-bottom: 20px;
    max-width: 960px;
  }}
  .gradient-text {{
    background: linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #38BDF8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}
  .hero-desc {{
    font-size: 20px;
    font-weight: 400;
    line-height: 1.5;
    color: #94A3B8;
    max-width: 880px;
    margin-bottom: 12px;
  }}

  /* Bento Clinical Grid */
  .bento-section {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 12px;
  }}
  .bento-card {{
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 24px 24px;
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }}
  .bento-card::before {{
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
    opacity: 0.6;
  }}
  .bento-card-top {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }}
  .card-icon-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 22px;
  }}
  .card-badge {{
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    color: #94A3B8;
  }}
  .card-badge.green {{
    background: rgba(16, 185, 129, 0.15);
    color: #34D399;
  }}
  .card-badge.cyan {{
    background: rgba(6, 182, 212, 0.15);
    color: #38BDF8;
  }}
  .card-title {{
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 8px;
  }}
  .card-desc {{
    font-size: 14px;
    line-height: 1.45;
    color: #94A3B8;
  }}

  /* Footer & CTA */
  .footer {{
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .cta-banner {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.12) 100%);
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: 18px;
    padding: 20px 28px;
  }}
  .cta-text-group {{
    display: flex;
    flex-direction: column;
  }}
  .cta-headline {{
    font-size: 18px;
    font-weight: 800;
    color: #FFFFFF;
  }}
  .cta-sub {{
    font-size: 13px;
    color: #94A3B8;
    margin-top: 2px;
  }}
  .cta-btn {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: #10B981;
    color: #040911;
    font-size: 15px;
    font-weight: 800;
    padding: 12px 24px;
    border-radius: 9999px;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    text-decoration: none;
    letter-spacing: 0.02em;
  }}
  .meta-legal {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #64748B;
  }}
  .gov-badge {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #94A3B8;
  }}
  .url-highlight {{
    color: #38BDF8;
    font-weight: 600;
  }}
</style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="glow-top-right"></div>
  <div class="glow-bottom-left"></div>
  <div class="glow-center"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand-group">
      <img src="{logo_b64}" class="brand-logo" alt="Aegis Logo" />
      <div class="brand-text-col">
        <div class="brand-name">Aegis Health AI</div>
        <div class="brand-tagline">Clinical Intelligence Sentinel</div>
      </div>
    </div>
    <div class="partner-badge">
      <img src="{nvidia_b64}" class="nvidia-logo" alt="NVIDIA Inception" />
      <span class="partner-text">Inception Program</span>
    </div>
  </div>

  <!-- Hero Section -->
  <div class="hero">
    <div class="status-pill">
      <span class="pulse-dot"></span>
      <span>Live Zero-Knowledge Clinical Demo</span>
    </div>
    <h1 class="hero-title">
      Predicting <span class="gradient-text">Pre-Symptomatic Risk</span><br>
      Before Illness Emerges.
    </h1>
    <p class="hero-desc">
      The edge-native AI sentinel that maps multi-year biomarker trajectories, intercepts adverse drug-drug interactions, and delivers physician-grade clinical handoffs with 100% on-device privacy.
    </p>
  </div>

  <!-- Bento Clinical Intelligence Grid -->
  <div class="bento-section">
    <div class="bento-card">
      <div class="bento-card-top">
        <span class="card-icon-pill">📈</span>
        <span class="card-badge green">Trajectory Modeling</span>
      </div>
      <div class="card-title">Biomarker Velocity</div>
      <div class="card-desc">
        Quantifies micro-velocity in HbA1c, ApoB, and eGFR before diagnostic cutoffs breach, uncovering silent metabolic decay years ahead.
      </div>
    </div>

    <div class="bento-card">
      <div class="bento-card-top">
        <span class="card-icon-pill">🛡️</span>
        <span class="card-badge cyan">DPDP Act 2023</span>
      </div>
      <div class="card-title">Zero-Knowledge Vault</div>
      <div class="card-desc">
        Client-side biometric encryption. Your bloodwork and genetic markers never enter public training sets or centralized cloud data silos.
      </div>
    </div>

    <div class="bento-card">
      <div class="bento-card-top">
        <span class="card-icon-pill">💊</span>
        <span class="card-badge cyan">FDA & RxNorm</span>
      </div>
      <div class="card-title">Drug Interaction Matrix</div>
      <div class="card-desc">
        Visual N-way polypharmacy conflict engine that flags severe CYP450 enzyme competition, QT prolongation, and renal clearances.
      </div>
    </div>

    <div class="bento-card">
      <div class="bento-card-top">
        <span class="card-icon-pill">📋</span>
        <span class="card-badge green">Physician Handoff</span>
      </div>
      <div class="card-title">SBAR Clinical Briefs</div>
      <div class="card-desc">
        Synthesizes multi-page lab histories into structured Situation-Background-Assessment-Recommendation briefs with PubMed citations.
      </div>
    </div>
  </div>

  <!-- Footer & Interactive Demo CTA -->
  <div class="footer">
    <div class="cta-banner">
      <div class="cta-text-group">
        <div class="cta-headline">Experience the Live Zero-Knowledge Demo</div>
        <div class="cta-sub">Test biomarker forecasting & polypharmacy audit instantly on your device</div>
      </div>
      <a class="cta-btn" href="https://aegishealthai.co.in/demo">
        <span>Test Live Demo</span>
        <span>→</span>
      </a>
    </div>

    <div class="meta-legal">
      <div class="gov-badge">
        <span>🇮🇳 Govt. MSME Reg: UDYAM-MH-33-0782403</span>
        <span>•</span>
        <span>Mumbai, India</span>
      </div>
      <div>
        <span>Explore: </span>
        <span class="url-highlight">aegishealthai.co.in/demo</span>
      </div>
    </div>
  </div>

</body>
</html>
"""

    # ==========================================
    # 2. FACEBOOK / LINKEDIN LANDSCAPE (1200x630)
    # ==========================================
    html_landscape = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
  }}
  body {{
    width: 1200px;
    height: 630px;
    background-color: #030712;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Inter", sans-serif;
    color: #F8FAFC;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 44px 52px;
  }}

  /* Glows */
  .grid-pattern {{
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 36px 36px;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
  }}
  .glow-left {{
    position: absolute;
    top: -80px;
    left: -80px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }}
  .glow-right {{
    position: absolute;
    bottom: -100px;
    right: -80px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(118, 185, 0, 0.20) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }}

  .container {{
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 40px;
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 10;
  }}

  /* Left Column */
  .left-col {{
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .brand-header {{
    display: flex;
    align-items: center;
    gap: 14px;
  }}
  .logo {{
    width: 44px;
    height: 44px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.6));
  }}
  .brand-title {{
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #FFFFFF;
  }}
  .hero-tag {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    padding: 5px 14px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    color: #34D399;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    width: fit-content;
    margin-top: 14px;
  }}
  .main-headline {{
    font-size: 38px;
    font-weight: 850;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #FFFFFF;
    margin-top: 10px;
  }}
  .gradient-text {{
    background: linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #38BDF8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}
  .sub-headline {{
    font-size: 15px;
    line-height: 1.45;
    color: #94A3B8;
    margin-top: 10px;
  }}
  .left-footer {{
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 14px;
  }}
  .cta-button {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #10B981;
    color: #040911;
    font-size: 14px;
    font-weight: 800;
    padding: 10px 22px;
    border-radius: 9999px;
    box-shadow: 0 0 16px rgba(16, 185, 129, 0.45);
    text-decoration: none;
  }}
  .site-pill {{
    font-size: 13px;
    font-weight: 600;
    color: #38BDF8;
  }}

  /* Right Column: Bento Cards */
  .right-col {{
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
  }}
  .bento-mini {{
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 14px 18px;
    backdrop-filter: blur(12px);
  }}
  .mini-top {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }}
  .mini-title {{
    font-size: 14px;
    font-weight: 700;
    color: #FFFFFF;
  }}
  .mini-badge {{
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }}
  .mini-badge.green {{ background: rgba(16, 185, 129, 0.2); color: #34D399; }}
  .mini-badge.cyan {{ background: rgba(6, 182, 212, 0.2); color: #38BDF8; }}
  .mini-badge.lime {{ background: rgba(118, 185, 0, 0.2); color: #A3E635; }}
  .mini-desc {{
    font-size: 12px;
    line-height: 1.4;
    color: #94A3B8;
  }}
  .partner-strip {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(118, 185, 0, 0.25);
  }}
  .partner-strip img {{
    height: 22px;
  }}
  .strip-tag {{
    font-size: 11px;
    font-weight: 600;
    color: #A3E635;
  }}
</style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="glow-left"></div>
  <div class="glow-right"></div>

  <div class="container">
    <div class="left-col">
      <div>
        <div class="brand-header">
          <img src="{logo_b64}" class="logo" alt="Logo" />
          <div class="brand-title">Aegis Health AI</div>
        </div>
        <div class="hero-tag">
          <span>●</span>
          <span>Zero-Knowledge Clinical Intelligence</span>
        </div>
        <h1 class="main-headline">
          Pre-Symptomatic <span class="gradient-text">Trajectory Modeling</span> Before Disease Arrives.
        </h1>
        <p class="sub-headline">
          Continuous biomarker tracking, N-way drug interaction auditing, and physician-grade SBAR handoffs with 100% on-device biometric privacy.
        </p>
      </div>

      <div class="left-footer">
        <a class="cta-button" href="https://aegishealthai.co.in/demo">
          <span>Experience Live Demo →</span>
        </a>
        <span class="site-pill">🌐 aegishealthai.co.in/demo</span>
      </div>
    </div>

    <div class="right-col">
      <div class="bento-mini">
        <div class="mini-top">
          <span class="mini-title">📈 Biomarker Velocity</span>
          <span class="mini-badge green">Trajectory AI</span>
        </div>
        <div class="mini-desc">
          Detects early sub-clinical drift in HbA1c, ApoB, and eGFR up to 36 months before acute thresholds breach.
        </div>
      </div>

      <div class="bento-mini">
        <div class="mini-top">
          <span class="mini-title">🛡️ Zero-Knowledge Vault</span>
          <span class="mini-badge cyan">DPDP Act 2023</span>
        </div>
        <div class="mini-desc">
          Client-side encrypted zero-server analytics. Your personal health records never leak into cloud training sets.
        </div>
      </div>

      <div class="bento-mini">
        <div class="mini-top">
          <span class="mini-title">💊 Polypharmacy Safety Matrix</span>
          <span class="mini-badge cyan">FDA / RxNorm</span>
        </div>
        <div class="mini-desc">
          Real-time cross-referencing of drug-drug interactions, CYP450 competition, and QT prolongation warnings.
        </div>
      </div>

      <div class="partner-strip">
        <span class="strip-tag">Proud Member</span>
        <img src="{nvidia_b64}" alt="NVIDIA Inception" />
      </div>
    </div>
  </div>
</body>
</html>
"""

    temp_portrait = os.path.join(workspace_dir, "scripts", "temp_poster_portrait.html")
    temp_landscape = os.path.join(workspace_dir, "scripts", "temp_poster_landscape.html")

    with open(temp_portrait, "w", encoding="utf-8") as f:
        f.write(html_portrait)
    with open(temp_landscape, "w", encoding="utf-8") as f:
        f.write(html_landscape)

    out_portrait = os.path.join(public_dir, "aegis-launch-poster.png")
    out_landscape = os.path.join(public_dir, "aegis-launch-poster-landscape.png")

    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_exe):
        chrome_exe = "chrome"

    # 1. Render 1080x1350
    cmd_portrait = [
        chrome_exe,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1080,1350",
        f"--screenshot={out_portrait}",
        temp_portrait
    ]
    print(f"Rendering Instagram Portrait Poster (1080x1350) -> {out_portrait}")
    subprocess.run(cmd_portrait, check=True)

    # 2. Render 1200x630
    cmd_landscape = [
        chrome_exe,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1200,630",
        f"--screenshot={out_landscape}",
        temp_landscape
    ]
    print(f"Rendering Facebook Landscape Poster (1200x630) -> {out_landscape}")
    subprocess.run(cmd_landscape, check=True)

    # Clean up temp files
    try:
        os.remove(temp_portrait)
        os.remove(temp_landscape)
    except Exception:
        pass

    # Verify sizes
    im_p = Image.open(out_portrait)
    im_l = Image.open(out_landscape)
    print(f"Success! Portrait Poster generated: {im_p.size} at {out_portrait}")
    print(f"Success! Landscape Poster generated: {im_l.size} at {out_landscape}")

if __name__ == "__main__":
    render_posters()
