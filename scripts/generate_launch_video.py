#!/usr/bin/env python3
"""
Aegis Health AI — Studio Launch Video Generator (Reel / Shorts 1080x1920)
Overhauled with:
- Exact mathematical text centering & layout bounds (zero misalignment)
- Clean vector icons & capsule badges (zero broken unicode glyphs)
- Fully balanced vertical screen distribution from top header to bottom safe area
- High-fidelity medical ambient soundtrack muxed with FFmpeg
"""
import os
import math
import time
import subprocess
from PIL import Image, ImageDraw, ImageFont
import imageio.v3 as iio
import imageio_ffmpeg

# Import audio generator
from generate_audio_track import generate_cinematic_audio

# Video parameters
WIDTH = 1080
HEIGHT = 1920
FPS = 30
TOTAL_FRAMES = 240  # 8.0 seconds

# Brand Colors
BG_COLOR = (3, 7, 18)           # #030712 deep space navy
EMERALD = (16, 185, 129)        # #10B981
EMERALD_LIGHT = (52, 211, 153)  # #34D399
CYAN = (6, 182, 212)            # #06B6D4
CYAN_LIGHT = (56, 189, 248)     # #38BDF8
NVIDIA_GREEN = (118, 185, 0)    # #76B900
LIME_LIGHT = (163, 230, 53)     # #A3E635
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (148, 163, 184)    # #94A3B8
CARD_BG = (15, 23, 42, 220)     # dark glassmorphic slate with alpha
CARD_BORDER = (255, 255, 255, 28)

def get_font(name, size):
    fonts_dir = r"C:\Windows\Fonts"
    font_path = os.path.join(fonts_dir, name)
    if os.path.exists(font_path):
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            pass
    return ImageFont.load_default()

def ease_out_cubic(x):
    return 1 - pow(1 - min(max(x, 0.0), 1.0), 3)

def spring(t, omega=9.0, zeta=0.75):
    t = min(max(t, 0.0), 1.0)
    if t >= 1.0:
        return 1.0
    return 1.0 - math.exp(-zeta * omega * t) * math.cos(omega * t * (1.0 - zeta**2)**0.5)

def draw_rounded_rect(draw, bbox, fill, outline=None, width=1, radius=20):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def draw_text_centered(draw, y, text, fill, font):
    """Dynamically computes text width and draws it at exact horizontal center."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (WIDTH - tw) // 2
    draw.text((x, y), text, fill=fill, font=font)
    return bbox[3] - bbox[1]

def draw_pill_centered(draw, y, text, text_fill, bg_fill, border_color, font, pad_x=24, pad_y=10):
    """Draws a horizontally centered capsule pill with text."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w = tw + pad_x * 2
    h = th + pad_y * 2
    x0 = (WIDTH - w) // 2
    y0 = y
    draw_rounded_rect(draw, (x0, y0, x0 + w, y0 + h), fill=bg_fill, outline=border_color, width=1, radius=h//2)
    draw.text((x0 + pad_x, y0 + pad_y - 2), text, fill=text_fill, font=font)
    return h

def draw_capsule_badge(draw, x_right, y, text, text_color, bg_color, border_color, font, pad_x=14, pad_y=6):
    """Draws an aligned badge anchored to the right."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w = tw + pad_x * 2
    h = th + pad_y * 2
    x0 = x_right - w
    y0 = y
    draw_rounded_rect(draw, (x0, y0, x_right, y0 + h), fill=bg_color, outline=border_color, width=1, radius=h//2)
    draw.text((x0 + pad_x, y0 + pad_y - 2), text, fill=text_color, font=font)
    return w, h

def draw_check_circle(draw, center_x, center_y, radius=12, fill=EMERALD):
    """Draws a crisp antialiased green checkmark circle without font dependency."""
    draw.ellipse([center_x - radius, center_y - radius, center_x + radius, center_y + radius], fill=fill)
    # Checkmark lines
    draw.line([(center_x - 5, center_y), (center_x - 1, center_y + 4)], fill=(3, 7, 18), width=2)
    draw.line([(center_x - 1, center_y + 4), (center_x + 5, center_y - 4)], fill=(3, 7, 18), width=2)

def generate_video_with_audio():
    start_time = time.time()
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(workspace_dir, "public")
    temp_video_path = os.path.join(public_dir, "temp_render_video.mp4")
    final_video_path = os.path.join(public_dir, "aegis-launch-reel.mp4")

    # Step 1: Ensure music is generated
    audio_path = os.path.join(public_dir, "aegis-launch-music.wav")
    if not os.path.exists(audio_path):
        print("Synthesizing cinematic audio soundtrack...")
        generate_cinematic_audio()

    # Load high-res logo
    logo_path = os.path.join(public_dir, "aegis-logo-transparent.png")
    logo_orig = Image.open(logo_path).convert("RGBA")

    # Fonts
    font_title_hero = get_font("segoeuib.ttf", 64)
    font_title_lg = get_font("segoeuib.ttf", 46)
    font_title_md = get_font("segoeuib.ttf", 36)
    font_body_lg = get_font("segoeui.ttf", 28)
    font_body_md = get_font("segoeui.ttf", 24)
    font_body_sm = get_font("segoeui.ttf", 20)
    font_bold_md = get_font("segoeuib.ttf", 28)
    font_bold_sm = get_font("segoeuib.ttf", 23)
    font_bold_xs = get_font("segoeuib.ttf", 18)

    # Pre-render particle field
    particles = []
    for i in range(45):
        px = (i * 137.5) % WIDTH
        py = (i * 91.3) % HEIGHT
        speed = 1.0 + (i % 5) * 0.7
        size = 2 + (i % 3)
        particles.append({"x": px, "y": py, "speed": speed, "size": size})

    print(f"Rendering {TOTAL_FRAMES} frames ({TOTAL_FRAMES/FPS:.1f}s) to video stream...")

    frames = []

    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / FPS

        # Create base canvas
        base = Image.new("RGBA", (WIDTH, HEIGHT), (*BG_COLOR, 255))
        overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # 1. Subtle High-Tech Coordinate Grid
        grid_pitch = 60
        grid_alpha = int(14 + 6 * math.sin(t * 1.5))
        for gx in range(0, WIDTH, grid_pitch):
            draw.line([(gx, 0), (gx, HEIGHT)], fill=(255, 255, 255, grid_alpha), width=1)
        for gy in range(0, HEIGHT, grid_pitch):
            draw.line([(0, gy), (WIDTH, gy)], fill=(255, 255, 255, grid_alpha), width=1)

        # 2. Ambient Floating Biometric Particles
        for p in particles:
            cur_y = (p["y"] - frame_idx * p["speed"]) % HEIGHT
            p_alpha = int(45 + 35 * math.sin(frame_idx * 0.05 + p["x"]))
            draw.ellipse(
                [(p["x"] - p["size"], cur_y - p["size"]), (p["x"] + p["size"], cur_y + p["size"])],
                fill=(*EMERALD_LIGHT, p_alpha)
            )

        # 3. Persistent Top Brand Header (Aligned to Safe Area Y = 130)
        header_y = 130
        mini_logo = logo_orig.resize((60, 60), Image.Resampling.LANCZOS)
        overlay.paste(mini_logo, (75, header_y), mini_logo)
        draw.text((150, header_y + 4), "AEGIS HEALTH AI", fill=TEXT_WHITE, font=font_bold_sm)
        draw.text((150, header_y + 32), "CLINICAL INTELLIGENCE SENTINEL", fill=EMERALD_LIGHT, font=font_bold_xs)

        # NVIDIA Inception Pill (top right)
        draw_rounded_rect(draw, (WIDTH - 365, header_y + 6, WIDTH - 75, header_y + 54),
                          fill=(255, 255, 255, 12), outline=(*NVIDIA_GREEN, 130), width=1, radius=24)
        draw.ellipse([(WIDTH - 345, header_y + 24), (WIDTH - 335, header_y + 34)], fill=LIME_LIGHT)
        draw.text((WIDTH - 325, header_y + 19), "NVIDIA INCEPTION", fill=LIME_LIGHT, font=font_bold_xs)

        # ==========================================
        # ACT 1: FRAMES 0 - 60 (0.0s - 2.0s)
        # THE SENTINEL AWAKENING
        # ==========================================
        if frame_idx < 62:
            act1_prog = frame_idx / 55.0
            act1_ease = spring(act1_prog)

            center_x = WIDTH // 2
            center_y = HEIGHT // 2 - 130

            # Concentric expanding pulse rings
            for r_mult in [1.0, 1.45, 1.95]:
                radius = int((130 * r_mult) * (0.8 + 0.2 * act1_ease) + (frame_idx % 45) * 1.6)
                pulse_alpha = max(0, int(90 * (1.0 - (radius / 380.0))))
                draw.ellipse(
                    [(center_x - radius, center_y - radius), (center_x + radius, center_y + radius)],
                    outline=(*EMERALD, pulse_alpha), width=2
                )

            # Zooming & Luminous Shield Logo
            logo_scale = int(320 * (0.65 + 0.35 * act1_ease))
            cur_logo = logo_orig.resize((logo_scale, logo_scale), Image.Resampling.LANCZOS)
            overlay.paste(cur_logo, (center_x - logo_scale // 2, center_y - logo_scale // 2), cur_logo)

            # Hero Text with Mathematical Centering
            text_y = center_y + 230 + int((1.0 - act1_ease) * 50)

            # Category pill
            draw_pill_centered(draw, text_y, "● ZERO-KNOWLEDGE CLINICAL SENTINEL", EMERALD_LIGHT, (*EMERALD, 35), (*EMERALD, 120), font_bold_xs)

            # Main Title (centered)
            draw_text_centered(draw, text_y + 65, "Predicting Risk Before", TEXT_WHITE, font_title_hero)
            draw_text_centered(draw, text_y + 145, "Symptoms Arise.", CYAN_LIGHT, font_title_hero)

            # Subtitle (centered)
            draw_text_centered(draw, text_y + 245, "Edge-native multi-year biomarker trajectory modeling", TEXT_MUTED, font_body_md)
            draw_text_centered(draw, text_y + 285, "with 100% client-side privacy on your device.", TEXT_MUTED, font_body_md)

            # Bottom Safe Area Accreditation
            draw_text_centered(draw, HEIGHT - 180, "NVIDIA Inception Member • DPDP Act 2023 Compliant", TEXT_MUTED, font_body_sm)

        # ==========================================
        # ACT 2: FRAMES 60 - 125 (2.0s - 4.2s)
        # BIOMARKER TRAJECTORY HUD & MULTI-SYSTEM VITALS
        # ==========================================
        elif frame_idx < 127:
            act2_prog = (frame_idx - 60) / 55.0
            act2_ease = spring(act2_prog)

            # Central Aegis Emblem (perfectly centered X = 465, Y = 220)
            sub_logo = logo_orig.resize((150, 150), Image.Resampling.LANCZOS)
            overlay.paste(sub_logo, (WIDTH // 2 - 75, 220), sub_logo)

            # Status pill & Titles (Dynamically Centered)
            draw_pill_centered(draw, 390, "● PRE-SYMPTOMATIC DETECTION ACTIVE", EMERALD_LIGHT, (*EMERALD, 30), (*EMERALD, 110), font_bold_xs)
            draw_text_centered(draw, 445, "Biomarker Trajectory Sentinel", TEXT_WHITE, font_title_lg)
            draw_text_centered(draw, 508, "Continuous sub-clinical drift detection across 28+ lab panels", TEXT_MUTED, font_body_md)

            # ----------------------------------------------------
            # CARD 1: Cardiometabolic Sparkline (Y = 570 to 980, Height = 410px)
            # ----------------------------------------------------
            card1_y = 570 + int((1.0 - act2_ease) * 70)
            card1_w = WIDTH - 140
            card1_bbox = (70, card1_y, 70 + card1_w, card1_y + 410)
            draw_rounded_rect(draw, card1_bbox, fill=CARD_BG, outline=CARD_BORDER, width=1, radius=24)

            # Header inside Card 1
            draw.text((110, card1_y + 30), "HbA1c Glycemic Velocity", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card1_w - 30, card1_y + 26, "5.4% (OPTIMAL)", EMERALD_LIGHT, (*EMERALD, 35), (*EMERALD, 120), font_bold_xs)

            # Chart Background Grid Lines
            chart_left = 110
            chart_right = 70 + card1_w - 40
            chart_w = chart_right - chart_left
            chart_mid_y = card1_y + 200

            for gy_offset in [-55, 0, 55]:
                line_y = chart_mid_y + gy_offset
                draw.line([(chart_left, line_y), (chart_right, line_y)], fill=(255, 255, 255, 18), width=1)

            # Animated Sparkline Curve
            points = []
            steps = 60
            reveal_count = int(steps * min(act2_prog * 1.4, 1.0))
            for s in range(reveal_count):
                sx = chart_left + chart_w * (s / steps)
                # Gentle healthy descent curve with micro-oscillation
                norm_s = s / steps
                sy = chart_mid_y - 25 * math.sin(norm_s * math.pi * 1.8) + (norm_s * 20)
                points.append((sx, sy))

            # Area fill under curve
            if len(points) > 1:
                poly = [(chart_left, chart_mid_y + 75)] + points + [(points[-1][0], chart_mid_y + 75)]
                draw.polygon(poly, fill=(*EMERALD, 22))
                draw.line(points, fill=EMERALD_LIGHT, width=4)

                # Glowing leading node
                last_pt = points[-1]
                draw.ellipse([(last_pt[0] - 14, last_pt[1] - 14), (last_pt[0] + 14, last_pt[1] + 14)], fill=(*EMERALD, 70))
                draw.ellipse([(last_pt[0] - 8, last_pt[1] - 8), (last_pt[0] + 8, last_pt[1] + 8)], fill=EMERALD, outline=TEXT_WHITE, width=2)

            # Timeline labels row (Y = card1_y + 295)
            draw.text((chart_left, card1_y + 295), "36 Mo. Historic", fill=TEXT_MUTED, font=font_body_sm)
            draw.text((WIDTH // 2 - 80, card1_y + 295), "Current: 5.4%", fill=EMERALD_LIGHT, font=font_bold_sm)
            draw_capsule_badge(draw, chart_right, card1_y + 292, "24 Mo. Projected", CYAN_LIGHT, (*CYAN, 30), (*CYAN, 90), font_bold_xs)

            # Card 1 Status Footer (Y = card1_y + 350)
            draw_check_circle(draw, chart_left + 14, card1_y + 364, radius=10, fill=EMERALD)
            draw.text((chart_left + 36, card1_y + 352), "Velocity: -0.02%/yr • Zero Glycemic Spikes Detected", fill=TEXT_MUTED, font=font_body_sm)

            # ----------------------------------------------------
            # CARD 2: Multi-System Biomarker Vitals (Y = 1010 to 1440, Height = 430px)
            # ----------------------------------------------------
            card2_y = 1010 + int((1.0 - act2_ease) * 70)
            card2_bbox = (70, card2_y, 70 + card1_w, card2_y + 430)
            draw_rounded_rect(draw, card2_bbox, fill=CARD_BG, outline=CARD_BORDER, width=1, radius=24)

            # Card 2 Header
            draw.text((110, card2_y + 28), "Multi-System Risk Stratification", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card1_w - 30, card2_y + 24, "LIVE TELEMETRY", LIME_LIGHT, (*NVIDIA_GREEN, 30), (*NVIDIA_GREEN, 110), font_bold_xs)

            draw.line([(100, card2_y + 80), (70 + card1_w - 30, card2_y + 80)], fill=(255, 255, 255, 20), width=1)

            # Row 1: ApoB
            row1_y = card2_y + 105
            draw.ellipse([(110, row1_y + 6), (124, row1_y + 20)], fill=EMERALD)
            draw.text((140, row1_y), "ApoB Atherogenic Lipids", fill=TEXT_MUTED, font=font_body_lg)
            draw.text((WIDTH - 420, row1_y), "82 mg/dL", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card1_w - 30, row1_y - 2, "LOW RISK", EMERALD_LIGHT, (*EMERALD, 35), (*EMERALD, 110), font_bold_xs)

            # Row 2: eGFR
            row2_y = card2_y + 185
            draw.ellipse([(110, row2_y + 6), (124, row2_y + 20)], fill=CYAN)
            draw.text((140, row2_y), "eGFR Renal Clearance", fill=TEXT_MUTED, font=font_body_lg)
            draw.text((WIDTH - 420, row2_y), ">90 mL/min", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card1_w - 30, row2_y - 2, "OPTIMAL", CYAN_LIGHT, (*CYAN, 35), (*CYAN, 110), font_bold_xs)

            # Row 3: hs-CRP
            row3_y = card2_y + 265
            draw.ellipse([(110, row3_y + 6), (124, row3_y + 20)], fill=EMERALD)
            draw.text((140, row3_y), "hs-CRP Vascular Inflammation", fill=TEXT_MUTED, font=font_body_lg)
            draw.text((WIDTH - 420, row3_y), "0.8 mg/L", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card1_w - 30, row3_y - 2, "STABLE", EMERALD_LIGHT, (*EMERALD, 35), (*EMERALD, 110), font_bold_xs)

            # Summary Bar inside Card 2
            sum_box = (100, card2_y + 345, 70 + card1_w - 30, card2_y + 395)
            draw_rounded_rect(draw, sum_box, fill=(*EMERALD, 20), outline=(*EMERALD, 60), width=1, radius=12)
            draw_check_circle(draw, 126, card2_y + 370, radius=9, fill=EMERALD)
            draw.text((150, card2_y + 358), "Multi-year predictive convergence confirms optimal health trajectory", fill=EMERALD_LIGHT, font=font_body_sm)

            # ----------------------------------------------------
            # BOTTOM SAFE AREA & CALLOUT BAR (Y = 1490 to 1820)
            # ----------------------------------------------------
            draw_pill_centered(draw, 1510, "🌐 Experience Live Demo: aegishealthai.co.in/demo", TEXT_WHITE, (*CYAN, 35), (*CYAN, 140), font_bold_sm, pad_x=32, pad_y=14)
            draw_text_centered(draw, 1605, "Client-Side Encrypted Biometric Vault • DPDP Act 2023 Compliant", TEXT_MUTED, font_body_md)
            draw_text_centered(draw, 1655, "🇮🇳 Govt. MSME Reg: UDYAM-MH-33-0782403 • Mumbai, India", TEXT_MUTED, font_body_sm)

        # ==========================================
        # ACT 3: FRAMES 125 - 185 (4.2s - 6.2s)
        # ZERO-KNOWLEDGE VAULT & POLYPHARMACY MATRIX
        # ==========================================
        elif frame_idx < 187:
            act3_prog = (frame_idx - 125) / 55.0
            act3_ease = spring(act3_prog)

            # Central Aegis Emblem
            sub_logo = logo_orig.resize((150, 150), Image.Resampling.LANCZOS)
            overlay.paste(sub_logo, (WIDTH // 2 - 75, 220), sub_logo)

            draw_pill_centered(draw, 390, "● 100% CLIENT-SIDE ENCRYPTED COMPUTE", CYAN_LIGHT, (*CYAN, 30), (*CYAN, 120), font_bold_xs)
            draw_text_centered(draw, 445, "Zero-Knowledge Biometric Vault", TEXT_WHITE, font_title_lg)
            draw_text_centered(draw, 508, "Your health records never leave your local browser sandbox", TEXT_MUTED, font_body_md)

            card_w = WIDTH - 140

            # Feature Box 1: DPDP Act & Privacy Shield
            card_p_y = 570 + int((1.0 - act3_ease) * 60)
            draw_rounded_rect(draw, (70, card_p_y, 70 + card_w, card_p_y + 260), fill=CARD_BG, outline=CARD_BORDER, width=1, radius=24)

            draw.text((110, card_p_y + 28), "🛡️ On-Device Privacy Architecture", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card_w - 30, card_p_y + 24, "DPDP ACT 2023", CYAN_LIGHT, (*CYAN, 35), (*CYAN, 120), font_bold_xs)

            draw.text((110, card_p_y + 85), "No cloud training. Zero data brokering.", fill=CYAN_LIGHT, font=font_body_lg)
            draw.text((110, card_p_y + 135), "Biomarkers, DNA variants, and lab records are parsed purely", fill=TEXT_MUTED, font=font_body_md)
            draw.text((110, card_p_y + 172), "inside your browser's encrypted WebAssembly memory sandbox.", fill=TEXT_MUTED, font=font_body_md)

            # Feature Box 2: Drug-Drug Interaction Matrix
            card_d_y = card_p_y + 290
            draw_rounded_rect(draw, (70, card_d_y, 70 + card_w, card_d_y + 260), fill=CARD_BG, outline=CARD_BORDER, width=1, radius=24)

            draw.text((110, card_d_y + 28), "💊 Polypharmacy Safety Engine", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card_w - 30, card_d_y + 24, "FDA & RXNORM", EMERALD_LIGHT, (*EMERALD, 35), (*EMERALD, 120), font_bold_xs)

            draw.text((110, card_d_y + 85), "Real-Time Polypharmacy Conflict Audit", fill=EMERALD_LIGHT, font=font_body_lg)
            draw.text((110, card_d_y + 135), "Cross-references CYP450 enzyme competition, QT prolongation,", fill=TEXT_MUTED, font=font_body_md)
            draw.text((110, card_d_y + 172), "and renal clearance warnings across all active medications.", fill=TEXT_MUTED, font=font_body_md)

            # Feature Box 3: NVIDIA Inception Acceleration
            card_n_y = card_d_y + 290
            draw_rounded_rect(draw, (70, card_n_y, 70 + card_w, card_n_y + 230), fill=CARD_BG, outline=(*NVIDIA_GREEN, 110), width=1, radius=24)

            draw.text((110, card_n_y + 28), "⚡ Accelerated Clinical Intelligence", fill=TEXT_WHITE, font=font_bold_md)
            draw_capsule_badge(draw, 70 + card_w - 30, card_n_y + 24, "NVIDIA INCEPTION", LIME_LIGHT, (*NVIDIA_GREEN, 35), (*NVIDIA_GREEN, 120), font_bold_xs)

            draw.text((110, card_n_y + 85), "High-Throughput Clinical Edge Transformers", fill=LIME_LIGHT, font=font_body_lg)
            draw.text((110, card_n_y + 135), "Empowering scalable preventative medicine for India & global clinics.", fill=TEXT_MUTED, font=font_body_md)

            # Bottom Safe Area
            draw_pill_centered(draw, 1510, "🌐 Test Free On Your Browser: aegishealthai.co.in/demo", TEXT_WHITE, (*EMERALD, 35), (*EMERALD, 140), font_bold_sm, pad_x=32, pad_y=14)
            draw_text_centered(draw, 1605, "Zero Server Data Retention • Pure Client-Side Inference", TEXT_MUTED, font_body_md)
            draw_text_centered(draw, 1655, "🇮🇳 Govt. MSME Reg: UDYAM-MH-33-0782403 • Mumbai, India", TEXT_MUTED, font_body_sm)

        # ==========================================
        # ACT 4: FRAMES 185 - 240 (6.2s - 8.0s)
        # CALL TO ACTION & INTERACTIVE DEMO
        # ==========================================
        else:
            act4_prog = (frame_idx - 185) / 50.0
            act4_ease = spring(act4_prog)

            center_x = WIDTH // 2
            center_y = HEIGHT // 2 - 130

            # Logo Hero Pulse
            pulse_size = int(340 + 25 * math.sin(frame_idx * 0.15))
            cur_logo = logo_orig.resize((pulse_size, pulse_size), Image.Resampling.LANCZOS)
            overlay.paste(cur_logo, (center_x - pulse_size // 2, center_y - 210), cur_logo)

            # Radiant outer ring
            ring_r = int(220 + 20 * math.sin(frame_idx * 0.15))
            draw.ellipse([(center_x - ring_r, center_y - 45 - ring_r), (center_x + ring_r, center_y - 45 + ring_r)],
                         outline=(*EMERALD, 70), width=2)

            # CTA Titles (Mathematically Centered)
            cta_text_y = center_y + 190
            draw_text_centered(draw, cta_text_y, "Experience The Sentinel Demo", TEXT_WHITE, font_title_hero)
            draw_text_centered(draw, cta_text_y + 80, "Test pre-symptomatic biomarker forecasting & polypharmacy audit", TEXT_MUTED, font_body_lg)
            draw_text_centered(draw, cta_text_y + 125, "100% free with zero registration required.", TEXT_MUTED, font_body_md)

            # Big Glowing Interactive URL Button Pill
            pill_y = cta_text_y + 210
            pill_w = 780
            pill_h = 104
            pill_bbox = (center_x - pill_w // 2, pill_y, center_x + pill_w // 2, pill_y + pill_h)
            
            # Subtle outer glow on button
            draw_rounded_rect(draw, (pill_bbox[0] - 6, pill_bbox[1] - 6, pill_bbox[2] + 6, pill_bbox[3] + 6),
                              fill=(*EMERALD, 30), outline=None, radius=56)
            draw_rounded_rect(draw, pill_bbox, fill=(*EMERALD, 45), outline=(*EMERALD, 240), width=2, radius=52)
            draw_text_centered(draw, pill_y + 26, "👉 aegishealthai.co.in/demo", EMERALD_LIGHT, font_title_lg)

            # Bottom Safe Area Trust Badges
            draw_text_centered(draw, HEIGHT - 240, "Zero Sign-up Required • Instant On-Device Execution", TEXT_WHITE, font_body_md)
            draw.line([(140, HEIGHT - 185), (WIDTH - 140, HEIGHT - 185)], fill=(255, 255, 255, 30), width=1)
            draw_text_centered(draw, HEIGHT - 150, "🇮🇳 Govt. MSME Registered: UDYAM-MH-33-0782403", TEXT_MUTED, font_body_md)
            draw_text_centered(draw, HEIGHT - 110, "Mumbai, India • Built for 1.4B Citizens", TEXT_MUTED, font_body_sm)

        # Composite base and overlay
        final_frame = Image.alpha_composite(base, overlay).convert("RGB")
        frames.append(final_frame)

        # Save inspection snapshots
        if frame_idx == 35:
            final_frame.save(os.path.join(public_dir, "aegis-reel-preview-act1.png"))
        elif frame_idx == 95:
            final_frame.save(os.path.join(public_dir, "aegis-reel-preview-act2.png"))
        elif frame_idx == 155:
            final_frame.save(os.path.join(public_dir, "aegis-reel-preview-act3.png"))
        elif frame_idx == 215:
            final_frame.save(os.path.join(public_dir, "aegis-reel-preview-act4.png"))

        if frame_idx % 30 == 0 or frame_idx == TOTAL_FRAMES - 1:
            print(f"Rendered frame {frame_idx + 1}/{TOTAL_FRAMES} ({(frame_idx+1)/TOTAL_FRAMES*100:.1f}%)")

    # Step 2: Encode video with imageio to temp MP4
    print("Encoding raw video stream to temp MP4...")
    iio.imwrite(
        temp_video_path,
        frames,
        fps=FPS,
        codec="libx264",
        pixelformat="yuv420p",
        macro_block_size=1
    )

    # Step 3: Mux with audio track using bundled FFmpeg
    print("Muxing video with cinematic soundtrack using FFmpeg...")
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg_exe, "-y",
        "-i", temp_video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_video_path
    ]
    subprocess.run(cmd, check=True)

    # Clean up temp video
    try:
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
    except Exception:
        pass

    elapsed = time.time() - start_time
    file_size_mb = os.path.getsize(final_video_path) / (1024 * 1024)
    print("=" * 60)
    print(f"SUCCESS! Master Launch Reel generated with Audio:")
    print(f"• Video: {final_video_path}")
    print(f"• Size: {file_size_mb:.2f} MB")
    print(f"• Audio: Stereo AAC 192k (Cardiac pulse + Ambient Synth + Chimes)")
    print(f"• Duration: {TOTAL_FRAMES/FPS:.1f}s ({FPS} FPS)")
    print(f"• Total Build Time: {elapsed:.2f}s")
    print("=" * 60)

if __name__ == "__main__":
    generate_video_with_audio()
