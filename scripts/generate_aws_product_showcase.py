#!/usr/bin/env python3
"""
Generate a rich, high-density 1960x980 Product Showcase image for AWS Startups Showcase.
Features dense, realistic MedTech UI: Dual AI Consensus, Biochemical Matrix, 3D Organ Telemetry, and ABDM ABHA Card.
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

def render_rich_showcase():
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
    background-color: #030712;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Inter", sans-serif;
    color: #F8FAFC;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 32px 48px 28px 48px;
  }}

  /* High-Tech Background Elements */
  .grid-pattern {{
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }}
  .glow-top-left {{
    position: absolute;
    top: -120px;
    left: -80px;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%);
    filter: blur(70px);
    pointer-events: none;
  }}
  .glow-top-right {{
    position: absolute;
    top: -100px;
    right: -80px;
    width: 750px;
    height: 750px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%);
    filter: blur(80px);
    pointer-events: none;
  }}
  .glow-bottom-center {{
    position: absolute;
    bottom: -150px;
    left: 40%;
    width: 900px;
    height: 550px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
    filter: blur(90px);
    pointer-events: none;
  }}

  /* Top Navigation Bar */
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 10;
    margin-bottom: 20px;
  }}
  .brand-group {{
    display: flex;
    align-items: center;
    gap: 16px;
  }}
  .brand-logo {{
    width: 52px;
    height: 52px;
    filter: drop-shadow(0 0 24px rgba(16, 185, 129, 0.5));
  }}
  .brand-name {{
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 10px;
  }}
  .version-tag {{
    font-size: 11px;
    padding: 3px 8px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34D399;
    border-radius: 6px;
    font-weight: 700;
  }}
  .brand-tagline {{
    font-size: 13px;
    color: #94A3B8;
    font-weight: 500;
    letter-spacing: 0.5px;
  }}
  .badge-cluster {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  .pill-badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    color: #E2E8F0;
    backdrop-filter: blur(12px);
  }}
  .pill-badge.bedrock {{
    border-color: rgba(245, 158, 11, 0.4);
    background: rgba(245, 158, 11, 0.1);
    color: #FBBF24;
  }}
  .pill-badge.abdm {{
    border-color: rgba(16, 185, 129, 0.4);
    background: rgba(16, 185, 129, 0.1);
    color: #34D399;
  }}
  .nvidia-badge-img {{
    height: 28px;
    filter: brightness(1.15);
  }}

  /* Main Split Cockpit (Left: 58%, Right: 42%) */
  .main-cockpit {{
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 24px;
    flex: 1;
    position: relative;
    z-index: 10;
    min-height: 0;
  }}

  .col-left, .col-right {{
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 0;
  }}

  /* Glassmorphic Panel Container */
  .panel {{
    background: rgba(11, 19, 38, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 22px 24px;
    backdrop-filter: blur(20px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }}
  .panel::before {{
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.6), transparent);
  }}
  .panel.accent-green::before {{
    background: linear-gradient(90deg, transparent, #34D399, transparent);
  }}
  .panel.accent-amber::before {{
    background: linear-gradient(90deg, transparent, #F59E0B, transparent);
  }}
  .panel.accent-purple::before {{
    background: linear-gradient(90deg, transparent, #A855F7, transparent);
  }}

  .panel-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }}
  .panel-title-group {{
    display: flex;
    align-items: center;
    gap: 10px;
  }}
  .panel-icon {{
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }}
  .panel-title {{
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: #FFFFFF;
  }}
  .status-tag {{
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .tag-green {{ background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.35); }}
  .tag-cyan {{ background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.35); }}
  .tag-amber {{ background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.35); }}
  .tag-purple {{ background: rgba(168, 85, 247, 0.15); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.35); }}

  /* ============================================================ */
  /* PANEL 1: 3D ANATOMY SCANNER & LIVE BIOMETRIC VITAL TELEMETRY */
  /* ============================================================ */
  .telemetry-layout {{
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 20px;
    align-items: center;
    flex: 1;
  }}
  .anatomy-silhouette {{
    width: 140px;
    height: 180px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }}
  .scan-beam {{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #34D399;
    box-shadow: 0 0 14px #34D399;
  }}
  .hotspot {{
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #38BDF8;
    box-shadow: 0 0 10px #38BDF8;
  }}
  .hotspot.heart {{ top: 38%; left: 48%; background: #EF4444; box-shadow: 0 0 12px #EF4444; }}
  .hotspot.lungs {{ top: 40%; left: 32%; background: #34D399; box-shadow: 0 0 10px #34D399; }}
  .hotspot.liver {{ top: 52%; left: 40%; background: #F59E0B; box-shadow: 0 0 10px #F59E0B; }}

  .vitals-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }}
  .vital-card {{
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }}
  .vital-label {{
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .vital-val {{
    font-size: 20px;
    font-weight: 800;
    color: #F8FAFC;
    letter-spacing: -0.5px;
    font-family: ui-monospace, monospace;
  }}
  .vital-val span.unit {{
    font-size: 12px;
    font-weight: 500;
    color: #94A3B8;
  }}
  .vital-val.green {{ color: #34D399; }}
  .vital-val.cyan {{ color: #38BDF8; }}
  .vital-sub {{
    font-size: 11px;
    font-weight: 600;
    color: #34D399;
  }}

  /* Waveform strip */
  .ecg-strip {{
    margin-top: 14px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 12px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}
  .ecg-title {{
    font-size: 11px;
    font-weight: 700;
    color: #38BDF8;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .ecg-svg {{
    width: 65%;
    height: 32px;
  }}

  /* ============================================================ */
  /* PANEL 2: BIOCHEMICAL DRUG-DRUG CLASH MATRIX & RXNORM         */
  /* ============================================================ */
  .clash-matrix-container {{
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}
  .drug-table {{
    width: 100%;
    border-collapse: separate;
    border-spacing: 6px;
  }}
  .drug-cell-head {{
    font-size: 11px;
    font-weight: 700;
    color: #94A3B8;
    text-align: center;
    padding: 6px;
  }}
  .drug-cell {{
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 11px;
    text-align: center;
    font-weight: 600;
  }}
  .drug-cell.safe {{
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.35);
    color: #34D399;
  }}
  .drug-cell.caution {{
    background: rgba(245, 158, 11, 0.14);
    border-color: rgba(245, 158, 11, 0.4);
    color: #FBBF24;
  }}
  .drug-cell.danger {{
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
    color: #F87171;
  }}
  .clash-banner {{
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }}
  .clash-left {{
    display: flex;
    align-items: center;
    gap: 8px;
    color: #FBBF24;
    font-weight: 600;
  }}

  /* ============================================================ */
  /* PANEL 3: DUAL-MODEL CLINICAL CONSENSUS (BEDROCK + GEMINI)    */
  /* ============================================================ */
  .consensus-flow {{
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }}
  .model-card {{
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }}
  .model-card.bedrock {{
    border-left: 3px solid #F59E0B;
  }}
  .model-card.gemini {{
    border-left: 3px solid #38BDF8;
  }}
  .model-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .model-name {{
    font-size: 13px;
    font-weight: 700;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .model-meta {{
    font-size: 11px;
    color: #64748B;
    font-family: ui-monospace, monospace;
  }}
  .model-snippet {{
    font-size: 12px;
    color: #CBD5E1;
    line-height: 1.4;
  }}
  .consensus-meter {{
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.35);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}
  .consensus-score-col {{
    display: flex;
    flex-direction: column;
  }}
  .consensus-score-title {{
    font-size: 11px;
    font-weight: 700;
    color: #34D399;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .consensus-score-num {{
    font-size: 24px;
    font-weight: 800;
    color: #FFFFFF;
    font-family: ui-monospace, monospace;
  }}
  .consensus-badge-verified {{
    padding: 6px 14px;
    background: #10B981;
    color: #030712;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  /* ============================================================ */
  /* PANEL 4: NHA ABDM DIGITAL HEALTH VAULT & FHIR R4             */
  /* ============================================================ */
  .abdm-card-mock {{
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
  }}
  .abdm-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .abdm-gov-title {{
    font-size: 11px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }}
  .abdm-num {{
    font-size: 16px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: 2px;
    font-family: ui-monospace, monospace;
  }}
  .abdm-stats-row {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 4px;
  }}
  .abdm-stat-box {{
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }}
  .abdm-stat-lbl {{
    font-size: 10px;
    color: #64748B;
    text-transform: uppercase;
  }}
  .abdm-stat-val {{
    font-size: 12px;
    font-weight: 700;
    color: #38BDF8;
  }}
  .abdm-stat-val.green {{ color: #34D399; }}

  /* Footer Bottom Bar */
  .footer {{
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .footer-chips {{
    display: flex;
    align-items: center;
    gap: 24px;
    font-size: 13px;
    font-weight: 600;
    color: #94A3B8;
  }}
  .chip-item {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .chip-item span.green {{ color: #34D399; }}
  .url-badge {{
    font-size: 14px;
    font-weight: 700;
    color: #38BDF8;
    background: rgba(56, 189, 248, 0.12);
    padding: 7px 18px;
    border-radius: 8px;
    border: 1px solid rgba(56, 189, 248, 0.35);
  }}
</style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="glow-top-left"></div>
  <div class="glow-top-right"></div>
  <div class="glow-bottom-center"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand-group">
      <img src="{logo_b64}" class="brand-logo" alt="Aegis Health AI" />
      <div>
        <div class="brand-name">
          <span>Aegis Health AI</span>
          <span class="version-tag">ENTERPRISE LIVE</span>
        </div>
        <div class="brand-tagline">Clinical Intelligence & Real-Time Patient Safety Sentinel</div>
      </div>
    </div>
    <div class="badge-cluster">
      <div class="pill-badge bedrock">
        <span>⚡ AWS Bedrock Mantle Multi-Model</span>
      </div>
      <div class="pill-badge abdm">
        <span>🛡️ NHA ABDM Certified (M1/M2/M3)</span>
      </div>
      <img src="{nvidia_b64}" class="nvidia-badge-img" alt="NVIDIA Inception" />
    </div>
  </div>

  <!-- Main Cockpit Layout -->
  <div class="main-cockpit">

    <!-- LEFT COLUMN: Anatomy Telemetry & Drug Matrix -->
    <div class="col-left">

      <!-- Panel 1: 3D Holographic Telemetry & Vitals -->
      <div class="panel accent-green" style="flex: 1.1;">
        <div class="panel-header">
          <div class="panel-title-group">
            <div class="panel-icon">🫀</div>
            <div class="panel-title">3D Holographic Anatomy Scanner & Biomarker Telemetry</div>
          </div>
          <span class="status-tag tag-green">● Live Telemetry Stream</span>
        </div>

        <div class="telemetry-layout">
          <!-- Holographic Anatomy Silhouette -->
          <div class="anatomy-silhouette">
            <div class="scan-beam"></div>
            <!-- Hotspots -->
            <div class="hotspot heart"></div>
            <div class="hotspot lungs"></div>
            <div class="hotspot liver"></div>
            <svg viewBox="0 0 100 160" width="85" height="135" style="opacity: 0.85;">
              <path d="M50 15 C45 15 42 20 42 26 C42 32 45 37 50 37 C55 37 58 32 58 26 C58 20 55 15 50 15 Z" fill="none" stroke="#38BDF8" stroke-width="1.8" />
              <path d="M38 42 L62 42 L68 75 L60 80 L62 145 L52 145 L50 95 L48 145 L38 145 L40 80 L32 75 Z" fill="none" stroke="#38BDF8" stroke-width="1.8" />
            </svg>
          </div>

          <!-- 4 Vitals Tiles -->
          <div>
            <div class="vitals-grid">
              <div class="vital-card">
                <span class="vital-label">Resting HR</span>
                <span class="vital-val green">68 <span class="unit">bpm</span></span>
                <span class="vital-sub">Normal Sinus</span>
              </div>
              <div class="vital-card">
                <span class="vital-label">Blood Pressure</span>
                <span class="vital-val">118/76</span>
                <span class="vital-sub">Optimal Range</span>
              </div>
              <div class="vital-card">
                <span class="vital-label">Blood Oxygen</span>
                <span class="vital-val cyan">99 <span class="unit">%</span></span>
                <span class="vital-sub">Continuous SpO2</span>
              </div>
              <div class="vital-card">
                <span class="vital-label">ApoB Velocity</span>
                <span class="vital-val green">-4.2 <span class="unit">%</span></span>
                <span class="vital-sub">Improving Slope</span>
              </div>
            </div>

            <!-- Real ECG Waveform -->
            <div class="ecg-strip">
              <div class="ecg-title">
                <span style="color:#34D399;">●</span> Lead II ECG
              </div>
              <svg class="ecg-svg" viewBox="0 0 400 30" preserveAspectRatio="none">
                <path d="M0,15 L40,15 L45,15 L50,12 L55,18 L60,15 L70,15 L75,2 L80,28 L85,8 L90,15 L100,15 L105,10 L115,15 L160,15 L165,15 L170,12 L175,18 L180,15 L190,15 L195,2 L200,28 L205,8 L210,15 L220,15 L225,10 L235,15 L280,15 L285,15 L290,12 L295,18 L300,15 L310,15 L315,2 L320,28 L325,8 L330,15 L340,15 L345,10 L355,15 L400,15" fill="none" stroke="#10B981" stroke-width="2" />
              </svg>
              <span style="font-size:11px; color:#94A3B8; font-family:monospace;">QRS 84ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 2: Biochemical Drug-Drug Clash Matrix -->
      <div class="panel accent-amber" style="flex: 0.9;">
        <div class="panel-header">
          <div class="panel-title-group">
            <div class="panel-icon">💊</div>
            <div class="panel-title">Biochemical Polypharmacy Clash & RxNorm Engine</div>
          </div>
          <span class="status-tag tag-amber">Sub-millisecond Screen</span>
        </div>

        <div class="clash-matrix-container">
          <!-- 4x4 Drug Interaction Grid -->
          <table class="drug-table">
            <tr>
              <td class="drug-cell-head">Rx Cocktail</td>
              <td class="drug-cell-head">Metformin</td>
              <td class="drug-cell-head">Lisinopril</td>
              <td class="drug-cell-head">Atorvastatin</td>
              <td class="drug-cell-head">Spironolactone</td>
            </tr>
            <tr>
              <td class="drug-cell-head">Metformin</td>
              <td class="drug-cell safe">✓ Neutral</td>
              <td class="drug-cell safe">✓ Synergistic</td>
              <td class="drug-cell safe">✓ Compatible</td>
              <td class="drug-cell safe">✓ Monitored</td>
            </tr>
            <tr>
              <td class="drug-cell-head">Lisinopril</td>
              <td class="drug-cell safe">✓ Synergistic</td>
              <td class="drug-cell safe">✓ Neutral</td>
              <td class="drug-cell safe">✓ Compatible</td>
              <td class="drug-cell caution">⚠️ K+ Retention</td>
            </tr>
            <tr>
              <td class="drug-cell-head">Atorvastatin</td>
              <td class="drug-cell safe">✓ Compatible</td>
              <td class="drug-cell safe">✓ Compatible</td>
              <td class="drug-cell safe">✓ Neutral</td>
              <td class="drug-cell safe">✓ Cleared</td>
            </tr>
          </table>

          <div class="clash-banner">
            <div class="clash-left">
              <span>⚠️</span>
              <span>OpenFDA Safety Alert: Lisinopril + Spironolactone dual ACEi/MRA elevation risk flagged</span>
            </div>
            <span style="font-size: 11px; color: #E2E8F0; font-weight:700;">RxNorm CUI: 29046</span>
          </div>
        </div>
      </div>

    </div>

    <!-- RIGHT COLUMN: Dual AI Consensus & ABDM Health Vault -->
    <div class="col-right">

      <!-- Panel 3: Dual-Model Clinical Consensus -->
      <div class="panel accent-cyan" style="flex: 1.15;">
        <div class="panel-header">
          <div class="panel-title-group">
            <div class="panel-icon">🧠</div>
            <div class="panel-title">Dual-Model Clinical AI Consensus Engine</div>
          </div>
          <span class="status-tag tag-cyan">AWS Bedrock + Gemini</span>
        </div>

        <div class="consensus-flow">
          <!-- Bedrock Card -->
          <div class="model-card bedrock">
            <div class="model-top">
              <span class="model-name">
                <span style="color:#F59E0B;">●</span> Amazon Bedrock (DeepSeek V3.2)
              </span>
              <span class="model-meta">Latency: 380ms · us-east-1</span>
            </div>
            <div class="model-snippet">
              "Microcytic hypochromic anemia confirmed (MCV 72 fL). Zero renal contraindication detected with current ACEi therapy."
            </div>
          </div>

          <!-- Gemini Card -->
          <div class="model-card gemini">
            <div class="model-top">
              <span class="model-name">
                <span style="color:#38BDF8;">●</span> Google Gemini (gemini-3.6-flash)
              </span>
              <span class="model-meta">Latency: 412ms · Edge Proxy</span>
            </div>
            <div class="model-snippet">
              "Clinical findings correlate with microcytic anemia secondary to iron deficiency. Recommend ferritin & TIBC lab panel."
            </div>
          </div>

          <!-- Consensus Meter -->
          <div class="consensus-meter">
            <div class="consensus-score-col">
              <span class="consensus-score-title">Agreement Score</span>
              <span class="consensus-score-num">98.4%</span>
            </div>
            <div class="consensus-badge-verified">
              <span>✓</span>
              <span>CONSENSUS VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel 4: NHA ABDM Digital Health Vault -->
      <div class="panel accent-purple" style="flex: 0.85;">
        <div class="panel-header">
          <div class="panel-title-group">
            <div class="panel-icon">🇮🇳</div>
            <div class="panel-title">NHA ABDM Digital Health Vault & FHIR R4</div>
          </div>
          <span class="status-tag tag-purple">DPDP Act 2023</span>
        </div>

        <div class="abdm-card-mock">
          <div class="abdm-top">
            <span class="abdm-gov-title">Ayushman Bharat Health Account (ABHA)</span>
            <span style="font-size:11px; color:#34D399; font-weight:700;">● M1/M2/M3 CERTIFIED</span>
          </div>
          <div class="abdm-num">91-4820-1945-8821</div>

          <div class="abdm-stats-row">
            <div class="abdm-stat-box">
              <span class="abdm-stat-lbl">Care Contexts</span>
              <span class="abdm-stat-val">6 Active Links</span>
            </div>
            <div class="abdm-stat-box">
              <span class="abdm-stat-lbl">Encryption</span>
              <span class="abdm-stat-val green">AES-GCM-256</span>
            </div>
            <div class="abdm-stat-box">
              <span class="abdm-stat-lbl">Data Residency</span>
              <span class="abdm-stat-val">ap-south-1</span>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- Footer Feature Strip -->
  <div class="footer">
    <div class="footer-chips">
      <div class="chip-item">
        <span class="green">✓</span>
        <span>Amazon Bedrock Mantle Multi-Model Endpoint</span>
      </div>
      <div class="chip-item">
        <span class="green">✓</span>
        <span>ap-south-1 Mumbai Cloud Data Residency</span>
      </div>
      <div class="chip-item">
        <span class="green">✓</span>
        <span>NVIDIA Inception Program Member</span>
      </div>
      <div class="chip-item">
        <span class="green">✓</span>
        <span>100% Offline-First Progressive Web App</span>
      </div>
    </div>
    <div class="url-badge">
      https://aegishealthai.co.in
    </div>
  </div>

</body>
</html>
"""

    temp_html = os.path.join(workspace_dir, "scripts", "temp_rich_showcase.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    output_path = os.path.join(public_dir, "aegis_product_showcase_1960x980.jpg")
    artifact_path = os.path.join(r"C:\Users\dhuri\.gemini\antigravity\brain\8ce1d930-a501-4979-ac4f-612839463deb", "aegis_product_showcase_1960x980.jpg")

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
    print(f"Rendering Rich UI Showcase -> {output_path}")
    subprocess.run(cmd, check=True)

    try:
        os.remove(temp_html)
    except Exception:
        pass

    # Copy to brain artifact dir if present
    import shutil
    try:
        if os.path.exists(os.path.dirname(artifact_path)):
            shutil.copy2(output_path, artifact_path)
    except Exception:
        pass

    im = Image.open(output_path)
    print(f"Success! High-density showcase created: {im.size}")

if __name__ == "__main__":
    render_rich_showcase()
