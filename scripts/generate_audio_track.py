#!/usr/bin/env python3
"""
Aegis Health AI — Cinematic Audio Track Generator
Synthesizes an 8.0-second high-tech medical ambient soundtrack:
- Rhythmic cardiac heartbeat sub-pulse
- Warm cyberpunk medical ambient synth pad (D minor / F major / A minor)
- Digital telemetry arpeggio / scanning blips
- Cinematic riser & CTA resolution chime
Output: 44.1 kHz, 16-bit stereo WAV.
"""
import os
import math
import struct
import wave

SAMPLE_RATE = 44100
DURATION = 8.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

def generate_cinematic_audio():
    workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(workspace_dir, "public")
    out_wav_path = os.path.join(public_dir, "aegis-launch-music.wav")

    frames = bytearray()

    # Chord frequencies over time
    # 0.0s - 2.5s: D minor (D3: 146.8, F3: 174.6, A3: 220.0, D4: 293.7)
    # 2.5s - 5.0s: F major (F3: 174.6, A3: 220.0, C4: 261.6, F4: 349.2)
    # 5.0s - 6.8s: G minor / Riser (G3: 196.0, Bb3: 233.1, D4: 293.7, G4: 392.0)
    # 6.8s - 8.0s: D resolution (D3: 146.8, A3: 220.0, D4: 293.7, F#4: 370.0)

    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE

        # Master volume envelope (fade in 0-0.6s, fade out 7.4-8.0s)
        master_env = 1.0
        if t < 0.6:
            master_env = (t / 0.6)
        elif t > 7.4:
            master_env = max(0.0, (8.0 - t) / 0.6)

        # ----------------------------------------------------
        # 1. Cardiac Heartbeat Telemetry (Lub-Dub every 0.9s)
        # ----------------------------------------------------
        hb_cycle = t % 0.9
        hb_val = 0.0
        # "Lub" at 0.0s - 0.12s
        if hb_cycle < 0.12:
            hb_env = math.sin(math.pi * (hb_cycle / 0.12))
            hb_val = 0.35 * hb_env * math.sin(2 * math.pi * 55 * t)
        # "Dub" at 0.18s - 0.28s
        elif 0.18 < hb_cycle < 0.28:
            dub_t = (hb_cycle - 0.18) / 0.10
            hb_env = math.sin(math.pi * dub_t)
            hb_val = 0.25 * hb_env * math.sin(2 * math.pi * 65 * t)

        # Sub-bass drone (55Hz / 73Hz)
        sub_drone = 0.12 * math.sin(2 * math.pi * 55 * t) + 0.08 * math.sin(2 * math.pi * 73.4 * t)

        # ----------------------------------------------------
        # 2. Warm Medical Ambient Pad
        # ----------------------------------------------------
        if t < 2.5:
            notes = [146.8, 174.6, 220.0, 293.7]
        elif t < 5.0:
            notes = [174.6, 220.0, 261.6, 349.2]
        elif t < 6.8:
            notes = [196.0, 233.1, 293.7, 392.0]
        else:
            notes = [146.8, 220.0, 293.7, 440.0]

        pad_left = 0.0
        pad_right = 0.0
        lfo = 0.85 + 0.15 * math.sin(2 * math.pi * 0.4 * t)
        for idx, freq in enumerate(notes):
            weight = (0.08 / (idx + 1)) * lfo
            # Slight detune for analog stereo width
            pad_left += weight * math.sin(2 * math.pi * (freq - 0.3) * t)
            pad_right += weight * math.sin(2 * math.pi * (freq + 0.3) * t)

        # ----------------------------------------------------
        # 3. High-Tech Arpeggio / Telemetry Scanner Pings
        # ----------------------------------------------------
        # Plinks every 0.225s
        arp_notes = [880.0, 1046.5, 1318.5, 1760.0, 1174.7, 1318.5, 1567.9, 2093.0]
        step_idx = int((t * 4.5)) % len(arp_notes)
        step_t = (t * 4.5) % 1.0
        arp_env = math.exp(-6.0 * step_t)  # fast plink decay
        arp_freq = arp_notes[step_idx]
        
        # Pan alternating left/right
        pan_l = 0.5 + 0.4 * math.sin(t * 3.0)
        pan_r = 1.0 - pan_l
        arp_sig = 0.09 * arp_env * math.sin(2 * math.pi * arp_freq * t)
        arp_left = arp_sig * pan_l
        arp_right = arp_sig * pan_r

        # ----------------------------------------------------
        # 4. Cinematic Riser (4.8s to 6.8s) & CTA Chime (6.8s to 8.0s)
        # ----------------------------------------------------
        riser_sig = 0.0
        if 4.8 <= t < 6.8:
            r_prog = (t - 4.8) / 2.0
            r_freq = 180 + 600 * (r_prog ** 2)
            riser_sig = 0.12 * (r_prog ** 1.5) * (math.sin(2 * math.pi * r_freq * t) + 0.3 * math.sin(2 * math.pi * (r_freq * 1.5) * t))

        cta_chime = 0.0
        if t >= 6.8:
            c_prog = (t - 6.8) / 1.2
            c_env = math.exp(-2.5 * c_prog)
            # Brilliant major chord chime
            cta_chime = c_env * (
                0.12 * math.sin(2 * math.pi * 1174.7 * t) +
                0.09 * math.sin(2 * math.pi * 1760.0 * t) +
                0.06 * math.sin(2 * math.pi * 2349.3 * t)
            )

        # Mix channels
        left_mix = (hb_val + sub_drone + pad_left + arp_left + riser_sig + cta_chime) * master_env
        right_mix = (hb_val + sub_drone + pad_right + arp_right + riser_sig + cta_chime) * master_env

        # Soft clipping limiter
        left_mix = math.tanh(left_mix * 1.1)
        right_mix = math.tanh(right_mix * 1.1)

        val_l = int(left_mix * 32000)
        val_r = int(right_mix * 32000)
        frames.extend(struct.pack("<hh", val_l, val_r))

    with wave.open(out_wav_path, "w") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(frames)

    print(f"Generated Cinematic Medical Soundtrack: {out_wav_path} ({os.path.getsize(out_wav_path)/(1024*1024):.2f} MB)")
    return out_wav_path

if __name__ == "__main__":
    generate_cinematic_audio()
