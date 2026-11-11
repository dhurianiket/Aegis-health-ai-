#!/usr/bin/env python3
"""
Generate a bespoke 1960x980 Product Showcase image for AWS Startups Showcase using headless Chrome.
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

def render_showcase():
    workspace_dir = r"e:\Aegis-health-ai-"
    public_dir = os.path.join(workspace_dir, "public")
    
    logo_path = os.path.join(public_dir, "aegis-logo-transparent.png")
    nvidia_badge_path = os.path.join(public_dir, "nvidia-inception-badge.svg")
    nvidia_badge_png = os.path.join(public_dir, "nvidia-inception-badge.png")
    
    logo_b64 = get_base64_img(logo_path)
    nvidia_b64 = get_base64_img(nvidia_badge_path) or get_base64_img(nvidia_badge_png)

    html_content = f"""<!DOCTYPE html>
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
    width: 1960px;
    height: 980px;
    background-color: #060B18;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Inter", sans-serif;
    color: #F8FAFC;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 44px 56px 40px 56px;
  }}

  /* High-tech Cyber Grid & Ambient Volumetric Glows */
  .grid-pattern {{
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }}
  .glow-top-left {{
    position: absolute;
    top: -150px;
    left: -100px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%);
    filter: blur(60px);
    pointer-events: none;
  }}
  .glow-top-right {{
    position: absolute;
    top: -100px;
    right: -100px;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, transparent 70%);
    filter: blur(70px);
    pointer-events: none;
  }}
  .glow-bottom-center {{
    position: absolute;
    bottom: -150px;
    left: 45%;
    width: 800px;
    height: 500px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
    filter: blur(80px);
    pointer-events: none;
  }}

  /* Top Header Bar */
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 10;
  }}
  .brand-group {{
    display: flex;
    align-items: center;
    gap: 20px;
  }}
  .brand-logo {{
    width: 58px;
    height: 58px;
    filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.45));
  }}
  .brand-text {{
    display: flex;
    flex-direction: column;
  }}
  .brand-title {{
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #FFFFFF;
  }}
  .brand-subtitle {{
    font-size: 13px;
    color: #94A3B8;
    font-weight: 500;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }}
  .badge-cluster {{
    display: flex;
    align-items: center;
    gap: 14px;
  }}
  .pill-badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    color: #E2E8F0;
    backdrop-filter: blur(12px);
  }}
  .pill-badge.bedrock {{
    border-color: rgba(245, 158, 11, 0.4);
    background: rgba(245, 158, 11, 0.08);
    color: #FBBF24;
  }}
  .pill-badge.abdm {{
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.08);
    color: #34D399;
  }}
  .nvidia-badge-img {{
    height: 28px;
    filter: brightness(1.1);
  }}

  /* Hero Headline Banner */
  .hero-bar {{
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 10px;
    margin-bottom: 20px;
  }}
  .hero-left {{
    max-width: 1200px;
  }}
  .hero-tag {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 14px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    color: #34D399;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }}
  .pulse-dot {{
    width: 7px;
    height: 7px;
    background: #34D399;
    border-radius: 50%;
    box-shadow: 0 0 10px #34D399;
  }}
  .hero-title {{
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.15;
  }}
  .gradient-cyan {{
    background: linear-gradient(135deg, #38BDF8 0%, #34D399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}
  .hero-desc {{
    font-size: 15px;
    color: #94A3B8;
    line-height: 1.5;
    margin-top: 6px;
    max-width: 1050px;
  }}

  /* 4-Card Bento Product UI Grid */
  .bento-grid {{
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    flex: 1;
    max-height: 470px;
  }}
  .bento-card {{
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 22px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    backdrop-filter: blur(16px);
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
  }}
  .bento-card::before {{
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent);
  }}
  .bento-card.highlight::before {{
    background: linear-gradient(90deg, transparent, #34D399, transparent);
  }}

  /* Card Header */
  .card-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }}
  .card-icon {{
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }}
  .card-badge {{
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .badge-emerald {{ background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }}
  .badge-amber {{ background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.3); }}
  .badge-sky {{ background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); }}
  .badge-purple {{ background: rgba(168, 85, 247, 0.15); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.3); }}

  .card-title {{
    font-size: 19px;
    font-weight: 700;
    color: #F8FAFC;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }}
  .card-desc {{
    font-size: 13px;
    color: #94A3B8;
    line-height: 1.45;
  }}

  /* Mock UI Widget Panels inside Cards */
  .mock-widget {{
    margin-top: 16px;
    padding: 14px;
    background: rgba(8, 14, 29, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }}
  .widget-row {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }}
  .widget-label {{
    color: #64748B;
    font-weight: 500;
  }}
  .widget-val {{
    color: #E2E8F0;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }}
  .widget-val.green {{ color: #34D399; }}
  .widget-val.cyan {{ color: #38BDF8; }}
  .progress-track {{
    width: 100%;
    height: 5px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    overflow: hidden;
  }}
  .progress-fill {{
    height: 100%;
    border-radius: 4px;
  }}
  .progress-fill.bedrock {{
    width: 98.4%;
    background: linear-gradient(90deg, #F59E0B, #10B981);
  }}
  .progress-fill.biocash {{
    width: 100%;
    background: linear-gradient(90deg, #38BDF8, #10B981);
  }}

  /* Bottom Bar */
  .footer {{
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .feature-strip {{
    display: flex;
    align-items: center;
    gap: 32px;
    font-size: 13px;
    font-weight: 600;
    color: #94A3B8;
  }}
  .feature-item {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .feature-item span.icon {{
    color: #34D399;
  }}
  .url-badge {{
    font-size: 14px;
    font-weight: 700;
    color: #38BDF8;
    background: rgba(56, 189, 248, 0.1);
    padding: 8px 18px;
    border-radius: 10px;
    border: 1px solid rgba(56, 189, 248, 0.3);
    letter-spacing: 0.2px;
  }}
</style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="glow-top-left"></div>
  <div class="glow-top-right"></div>
  <div class="glow-bottom-center"></div>

  <!-- 1. Header Bar -->
  <div class="header">
    <div class="brand-group">
      <img src="{logo_b64}" class="brand-logo" alt="Aegis Health AI" />
      <div class="brand-text">
        <span class="brand-title">Aegis Health AI</span>
        <span class="brand-subtitle">Clinical Intelligence Platform</span>
      </div>
    </div>
    <div class="badge-cluster">
      <div class="pill-badge bedrock">
        <span>⚡ AWS Bedrock Mantle Multi-Model</span>
      </div>
      <div class="pill-badge abdm">
        <span>🛡️ NHA ABDM Certified (M1/M2/M3)</span>
      </div>
      <img src="{nvidia_b64}" class="nvidia-badge-img" alt="NVIDIA Inception Program" />
    </div>
  </div>

  <!-- 2. Hero Title Bar -->
  <div class="hero-bar">
    <div class="hero-left">
      <div class="hero-tag">
        <span class="pulse-dot"></span>
        <span>Dual-Model Architecture · Zero-Knowledge Privacy</span>
      </div>
      <div class="hero-title">
        Next-Generation <span class="gradient-cyan">Clinical Intelligence Engine</span> on AWS
      </div>
      <div class="hero-desc">
        Eliminating AI hallucinations through dual-model consensus verification, real-time polypharmacy clash detection, and end-to-end encrypted FHIR R4 interoperability.
      </div>
    </div>
  </div>

  <!-- 3. Bento Grid Showcase (The 4 Pillars) -->
  <div class="bento-grid">
    
    <!-- Card 1: Dual Clinical Consensus -->
    <div class="bento-card highlight">
      <div>
        <div class="card-top">
          <div class="card-icon">🧠</div>
          <span class="card-badge amber">Dual-Model AI</span>
        </div>
        <div class="card-title">Clinical Consensus</div>
        <div class="card-desc">
          Concurrently queries Amazon Bedrock (DeepSeek V3.2 / Mistral Large 3) and Gemini to verify diagnostic accuracy.
        </div>
      </div>
      <div class="mock-widget">
        <div class="widget-row">
          <span class="widget-label">Bedrock Mantle</span>
          <span class="widget-val cyan">deepseek.v3.2</span>
        </div>
        <div class="widget-row">
          <span class="widget-label">Consensus Score</span>
          <span class="widget-val green">98.4% Match</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bedrock"></div>
        </div>
      </div>
    </div>

    <!-- Card 2: Biochemical Clash Engine -->
    <div class="bento-card">
      <div>
        <div class="card-top">
          <div class="card-icon">💊</div>
          <span class="card-badge emerald">RxNorm & OpenFDA</span>
        </div>
        <div class="card-title">Drug Interaction Matrix</div>
        <div class="card-desc">
          Sub-millisecond screening of complex multi-drug cocktails against FDA Boxed Warnings and CYP450 enzyme pathways.
        </div>
      </div>
      <div class="mock-widget">
        <div class="widget-row">
          <span class="widget-label">FAERS Database</span>
          <span class="widget-val green">Live Synchronized</span>
        </div>
        <div class="widget-row">
          <span class="widget-label">Adverse Warning</span>
          <span class="widget-val green">0 Lethal Clashes</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill biocash"></div>
        </div>
      </div>
    </div>

    <!-- Card 3: 3D Holographic Telemetry -->
    <div class="bento-card">
      <div>
        <div class="card-top">
          <div class="card-icon">🫀</div>
          <span class="card-badge sky">Biometrics</span>
        </div>
        <div class="card-title">3D Organ Scanner</div>
        <div class="card-desc">
          Interactive anatomical 3D scanner mapping real-time ECG rhythms, blood pressure, and longitudinal lab velocity.
        </div>
      </div>
      <div class="mock-widget">
        <div class="widget-row">
          <span class="widget-label">Heart Rate (RHR)</span>
          <span class="widget-val green">68 bpm · Normal</span>
        </div>
        <div class="widget-row">
          <span class="widget-label">Biomarker Velocity</span>
          <span class="widget-val cyan">HbA1c Trajectory</span>
        </div>
      </div>
    </div>

    <!-- Card 4: NHA ABDM Gateway -->
    <div class="bento-card">
      <div>
        <div class="card-top">
          <div class="card-icon">🇮🇳</div>
          <span class="card-badge purple">DPDP Act 2023</span>
        </div>
        <div class="card-title">ABDM FHIR Exchange</div>
        <div class="card-desc">
          National Health Authority M1/M2/M3 compliance: instant Aadhaar ABHA QR check-in and encrypted health records.
        </div>
      </div>
      <div class="mock-widget">
        <div class="widget-row">
          <span class="widget-label">Encryption</span>
          <span class="widget-val green">AES-GCM-256</span>
        </div>
        <div class="widget-row">
          <span class="widget-label">Data Egress</span>
          <span class="widget-val green">Zero Cloud Leak</span>
        </div>
      </div>
    </div>

  </div>

  <!-- 4. Footer Feature Strip -->
  <div class="footer">
    <div class="feature-strip">
      <div class="feature-item">
        <span class="icon">✓</span>
        <span>Amazon Bedrock Mantle Endpoint</span>
      </div>
      <div class="feature-item">
        <span class="icon">✓</span>
        <span>ap-south-1 Mumbai Data Residency</span>
      </div>
      <div class="feature-item">
        <span class="icon">✓</span>
        <span>NVIDIA Inception Member</span>
      </div>
      <div class="feature-item">
        <span class="icon">✓</span>
        <span>Offline-First Progressive Web App</span>
      </div>
    </div>
    <div class="url-badge">
      https://aegishealthai.co.in
    </div>
  </div>

</body>
</html>
"""

    temp_html = os.path.join(workspace_dir, "scripts", "temp_aws_showcase.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    output_path = os.path.join(public_dir, "aegis_product_showcase_1960x980.jpg")

    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_exe):
        chrome_exe = "chrome"

    cmd = [
        chrome_exe,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1960,980",
        f"--screenshot={output_path}",
        temp_html
    ]
    print(f"Rendering AWS Product Showcase (1960x980) -> {output_path}")
    subprocess.run(cmd, check=True)

    try:
        os.remove(temp_html)
    except Exception:
        pass

    im = Image.open(output_path)
    print(f"Done! Verified size: {im.size} at {output_path}")

if __name__ == "__main__":
    render_showcase()
