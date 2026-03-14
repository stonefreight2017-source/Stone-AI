"""
THE PALACE — 4K Wallpaper Generator
Personal visual identities for each head of the Three-Headed Monster.
Uses only Pillow — no external image files needed.

Usage: python make_wallpaper.py
Output: palace_wallpaper.png in the same directory
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os
import random

# --- Config ---
W, H = 3840, 2160
GOLD = (218, 175, 72)
GOLD_DIM = (160, 128, 48)
GOLD_BRIGHT = (255, 215, 80)
SILVER = (180, 190, 210)
SILVER_DIM = (120, 130, 150)
WHITE = (240, 240, 245)
WHITE_DIM = (160, 165, 175)

# Stone colors
CHARCOAL = (55, 55, 60)
IRON_BLACK = (30, 30, 35)
MOLTEN_GOLD = (210, 170, 50)

# Cardinal colors
NAVY_DEEP = (12, 18, 40)
COLD_SILVER = (170, 180, 200)
MUTED_GOLD = (180, 155, 80)

# Chaos colors
MATTE_BLACK = (10, 10, 12)
CRIMSON_DEEP = (139, 0, 0)    # #8B0000
CRIMSON_BRIGHT = (255, 0, 0)  # #FF0000

# Wiz colors
GUNMETAL = (70, 75, 85)
ELECTRIC_CYAN = (0, 229, 255)  # #00E5FF
CYAN_DIM = (0, 140, 160)

# Rush colors
TACTICAL_GREEN = (0, 255, 100)     # #00FF64
GREEN_DIM = (0, 160, 65)
GREEN_DARK = (0, 80, 35)
BREACH_BLACK = (8, 12, 8)

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "palace_wallpaper.png")


def gradient_bg(draw):
    """Draw a dark navy-to-black vertical gradient."""
    top = (10, 14, 32)
    bot = (3, 3, 8)
    for y in range(H):
        t = y / H
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))


def get_font(size):
    """Try to load a good font, fall back gracefully."""
    candidates = [
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/georgia.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def get_bold_font(size):
    candidates = [
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/georgiab.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            continue
    return get_font(size)


def get_mono_font(size):
    candidates = [
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/cour.ttf",
        "C:/Windows/Fonts/lucon.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            continue
    return get_font(size)


def centered_text(draw, cx, cy, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2), text, font=font, fill=fill)


# ============================================================
# FOUNDER CROWN — Top Center, BIGGEST element, dominant
# ============================================================
def draw_founder(draw, cx, cy):
    """
    Crown with 5 golden spires, radiating golden threads,
    diamond center jewel. Must be the dominant visual element.
    """
    # Radiating golden threads
    for i in range(48):
        angle = math.radians(i * (360 / 48))
        length = 350 + (i % 3) * 50
        x2 = cx + length * math.cos(angle)
        y2 = cy + length * math.sin(angle)
        brightness = max(20, 80 - (i % 5) * 12)
        color = (brightness + 80, brightness + 60, brightness + 10)
        draw.line([(cx, cy), (x2, y2)], fill=color, width=1)

    # Thicker accent rays
    for i in range(16):
        angle = math.radians(i * 22.5 - 90)
        x2 = cx + 300 * math.cos(angle)
        y2 = cy + 300 * math.sin(angle)
        draw.line([(cx, cy), (x2, y2)], fill=GOLD_DIM, width=2)

    # Crown base band
    bw, bh = 260, 55
    draw.rounded_rectangle(
        [cx - bw, cy - 10, cx + bw, cy + bh],
        radius=8, fill=GOLD, outline=GOLD_BRIGHT, width=3,
    )

    # 5 golden spires
    spires_x = [-190, -95, 0, 95, 190]
    spires_h = [125, 155, 200, 155, 125]
    for sx, sh in zip(spires_x, spires_h):
        draw.polygon(
            [(cx + sx - 35, cy - 10), (cx + sx, cy - sh), (cx + sx + 35, cy - 10)],
            fill=GOLD, outline=GOLD_BRIGHT,
        )

    # Jewels on spire tips
    for sx, sh in zip(spires_x, spires_h):
        draw.ellipse(
            [cx + sx - 12, cy - sh - 6, cx + sx + 12, cy - sh + 18],
            fill=GOLD_BRIGHT, outline=WHITE, width=2,
        )

    # Center diamond jewel (biggest, in the band)
    ds = 28
    dcy = cy + 22
    draw.polygon(
        [(cx, dcy - ds), (cx + ds, dcy), (cx, dcy + ds), (cx - ds, dcy)],
        fill=(255, 255, 240), outline=GOLD_BRIGHT,
    )
    # Inner facet
    ds2 = 14
    draw.polygon(
        [(cx, dcy - ds2), (cx + ds2, dcy), (cx, dcy + ds2), (cx - ds2, dcy)],
        fill=GOLD_BRIGHT, outline=WHITE,
    )

    # Band detail lines
    for offset in [8, 20, 32, 44]:
        draw.line(
            [(cx - bw + 12, cy + offset), (cx + bw - 12, cy + offset)],
            fill=GOLD_DIM, width=1,
        )

    # FOUNDER text — bright gold, large
    font_title = get_bold_font(64)
    centered_text(draw, cx, cy + bh + 50, "FOUNDER", font_title, GOLD_BRIGHT)


# ============================================================
# STONE — "The Owner" — Weathered granite slab, chisel fracture, kintsugi gold
# ============================================================
def draw_stone(draw, cx, cy):
    """
    Weathered granite slab split by a chisel strike with 'STONE' carved
    across the fracture. Charcoal gray and iron black, with a vein of
    molten gold running through the crack (kintsugi style).
    """
    slab_w, slab_h = 320, 340
    x1, y1 = cx - slab_w // 2, cy - slab_h // 2
    x2, y2 = cx + slab_w // 2, cy + slab_h // 2

    # Outer border
    draw.rounded_rectangle(
        [x1 - 6, y1 - 6, x2 + 6, y2 + 6],
        radius=4, fill=IRON_BLACK, outline=(50, 50, 55), width=2,
    )

    # Granite slab
    draw.rounded_rectangle(
        [x1, y1, x2, y2], radius=3, fill=CHARCOAL, outline=(70, 70, 75), width=2,
    )

    # Granite texture — speckled noise
    rng = random.Random(42)
    for _ in range(300):
        px = rng.randint(x1 + 5, x2 - 5)
        py = rng.randint(y1 + 5, y2 - 5)
        shade = rng.randint(40, 80)
        draw.point((px, py), fill=(shade, shade, shade + 5))

    # Chisel fracture line — jagged diagonal crack through center
    crack_points = []
    crack_y_start = y1 + 30
    crack_y_end = y2 - 30
    crack_steps = 20
    for i in range(crack_steps + 1):
        t = i / crack_steps
        base_y = crack_y_start + (crack_y_end - crack_y_start) * t
        offset_x = rng.randint(-8, 8) + int(15 * math.sin(t * math.pi * 2.5))
        crack_points.append((cx + offset_x, int(base_y)))

    # Draw crack shadow (dark)
    for i in range(len(crack_points) - 1):
        p1 = crack_points[i]
        p2 = crack_points[i + 1]
        draw.line([p1, p2], fill=IRON_BLACK, width=6)

    # Draw molten gold kintsugi vein through crack
    for i in range(len(crack_points) - 1):
        p1 = crack_points[i]
        p2 = crack_points[i + 1]
        draw.line([p1, p2], fill=MOLTEN_GOLD, width=3)

    # Gold glow nodes at crack intersections
    for i in range(0, len(crack_points), 3):
        px, py = crack_points[i]
        draw.ellipse([px - 5, py - 5, px + 5, py + 5], fill=GOLD_BRIGHT)

    # "STONE" carved across the fracture
    font_carved = get_bold_font(96)
    # Depth shadow
    centered_text(draw, cx + 3, cy - 5 + 3, "STONE", font_carved, IRON_BLACK)
    # Main carved text
    centered_text(draw, cx, cy - 5, "STONE", font_carved, (90, 85, 80))
    # Chisel highlight edge
    centered_text(draw, cx - 1, cy - 6, "STONE", font_carved, (130, 125, 115))

    # Title below
    font_title = get_bold_font(38)
    centered_text(draw, cx, y2 + 40, "THE OWNER", font_title, CHARCOAL)


# ============================================================
# CARDINAL — "The Architect" — Chess bishop wireframe, radar circles
# ============================================================
def draw_cardinal(draw, cx, cy):
    """
    Chess bishop rendered as sleek architectural wireframe (not solid).
    Deep navy background, cold silver lines, muted gold accent.
    Faint concentric radar circles behind it. Clean geometry.
    'I see the whole board.'
    """
    # Background panel — deep navy
    panel_w, panel_h = 320, 380
    px1, py1 = cx - panel_w // 2, cy - panel_h // 2
    px2, py2 = cx + panel_w // 2, cy + panel_h // 2
    draw.rounded_rectangle(
        [px1, py1, px2, py2],
        radius=6, fill=NAVY_DEEP, outline=(30, 40, 70), width=2,
    )

    # Concentric radar circles (faint)
    for r in range(40, 200, 35):
        draw.ellipse(
            [cx - r, cy - 30 - r, cx + r, cy - 30 + r],
            outline=(25, 35, 60), width=1,
        )

    # Radar cross hairs
    draw.line([(cx, cy - 200), (cx, cy + 140)], fill=(25, 35, 60), width=1)
    draw.line([(cx - 180, cy - 30), (cx + 180, cy - 30)], fill=(25, 35, 60), width=1)

    # Bishop wireframe — constructed from lines only, no fills
    # Base
    draw.line([(cx - 80, cy + 100), (cx + 80, cy + 100)], fill=COLD_SILVER, width=2)
    draw.line([(cx - 80, cy + 100), (cx - 70, cy + 115)], fill=COLD_SILVER, width=2)
    draw.line([(cx + 80, cy + 100), (cx + 70, cy + 115)], fill=COLD_SILVER, width=2)
    draw.line([(cx - 70, cy + 115), (cx + 70, cy + 115)], fill=COLD_SILVER, width=2)

    # Second tier
    draw.line([(cx - 60, cy + 85), (cx + 60, cy + 85)], fill=COLD_SILVER, width=2)
    draw.line([(cx - 60, cy + 85), (cx - 80, cy + 100)], fill=COLD_SILVER, width=2)
    draw.line([(cx + 60, cy + 85), (cx + 80, cy + 100)], fill=COLD_SILVER, width=2)

    # Body — tapered wireframe lines
    body_left = [
        (cx - 55, cy + 85), (cx - 45, cy + 30), (cx - 35, cy - 20),
        (cx - 20, cy - 70), (cx - 8, cy - 100),
    ]
    body_right = [
        (cx + 55, cy + 85), (cx + 45, cy + 30), (cx + 35, cy - 20),
        (cx + 20, cy - 70), (cx + 8, cy - 100),
    ]
    for i in range(len(body_left) - 1):
        draw.line([body_left[i], body_left[i + 1]], fill=COLD_SILVER, width=2)
        draw.line([body_right[i], body_right[i + 1]], fill=COLD_SILVER, width=2)

    # Cross-struts (architectural wireframe feel)
    for i in range(len(body_left)):
        draw.line([body_left[i], body_right[i]], fill=(100, 110, 130), width=1)

    # Miter head (wireframe arc)
    draw.arc(
        [cx - 30, cy - 140, cx + 30, cy - 80],
        start=0, end=360, fill=COLD_SILVER, width=2,
    )

    # Miter slit
    draw.line([(cx - 5, cy - 135), (cx + 15, cy - 95)], fill=MUTED_GOLD, width=2)
    draw.line([(cx + 5, cy - 135), (cx - 15, cy - 95)], fill=MUTED_GOLD, width=2)

    # Tip sphere
    draw.ellipse(
        [cx - 8, cy - 150, cx + 8, cy - 134],
        outline=COLD_SILVER, width=2,
    )

    # Gold accent band
    draw.line([(cx - 45, cy + 55), (cx + 45, cy + 55)], fill=MUTED_GOLD, width=3)

    # Subtitle
    font_sub = get_font(20)
    centered_text(draw, cx, cy + 135, "I see the whole board.", font_sub, (100, 110, 140))

    # Title
    font_title = get_bold_font(38)
    centered_text(draw, cx, cy + 170, "THE ARCHITECT", font_title, COLD_SILVER)


# ============================================================
# CHAOS — "The Vanguard" — Circuit skull with scanning laser
# ============================================================
def draw_chaos(draw, cx, cy):
    """
    Skull made of circuit board traces, slightly glitched.
    One eye socket has a single red scanning laser dot.
    Circuit traces pulse outward like a heartbeat.
    Matte black background, deep crimson traces, bright red pulse at eye.
    Monospace font for text.
    """
    # Background panel — matte black
    panel_w, panel_h = 320, 380
    px1, py1 = cx - panel_w // 2, cy - panel_h // 2
    px2, py2 = cx + panel_w // 2, cy + panel_h // 2
    draw.rounded_rectangle(
        [px1, py1, px2, py2],
        radius=6, fill=MATTE_BLACK, outline=CRIMSON_DEEP, width=2,
    )

    # Heartbeat pulse rings radiating outward from skull center
    for r in range(30, 180, 25):
        alpha = max(30, 100 - r)
        pulse_color = (alpha, 0, 0)
        draw.ellipse(
            [cx - r, cy - 30 - r, cx + r, cy - 30 + r],
            outline=pulse_color, width=1,
        )

    # Skull cranium — circuit trace outline
    cranium_pts = []
    for i in range(20):
        angle = math.radians(180 + i * (180 / 19))
        rx, ry = 85, 90
        px = cx + int(rx * math.cos(angle))
        py = cy - 40 + int(ry * math.sin(angle))
        cranium_pts.append((px, py))
    cranium_pts.append((cx + 85, cy - 40))
    cranium_pts.insert(0, (cx - 85, cy - 40))
    for i in range(len(cranium_pts) - 1):
        draw.line([cranium_pts[i], cranium_pts[i + 1]], fill=CRIMSON_DEEP, width=2)

    # Jaw outline
    jaw_pts = [
        (cx - 75, cy - 40), (cx - 60, cy + 30), (cx - 40, cy + 60),
        (cx - 15, cy + 75), (cx + 15, cy + 75),
        (cx + 40, cy + 60), (cx + 60, cy + 30), (cx + 75, cy - 40),
    ]
    for i in range(len(jaw_pts) - 1):
        draw.line([jaw_pts[i], jaw_pts[i + 1]], fill=CRIMSON_DEEP, width=2)

    # Eye sockets — angular hexagons
    for side in [-1, 1]:
        ex = cx + side * 38
        ey = cy - 60
        eye_pts = [
            (ex - 22, ey), (ex - 12, ey - 20), (ex + 12, ey - 20),
            (ex + 22, ey), (ex + 12, ey + 20), (ex - 12, ey + 20),
        ]
        for i in range(len(eye_pts)):
            draw.line([eye_pts[i], eye_pts[(i + 1) % len(eye_pts)]], fill=CRIMSON_DEEP, width=2)

    # RIGHT eye — red scanning laser dot
    rex = cx + 38
    rey = cy - 60
    draw.ellipse([rex - 8, rey - 8, rex + 8, rey + 8], fill=CRIMSON_BRIGHT)
    # Laser glow
    draw.ellipse([rex - 14, rey - 14, rex + 14, rey + 14], outline=(200, 0, 0), width=1)
    draw.ellipse([rex - 20, rey - 20, rex + 20, rey + 20], outline=(120, 0, 0), width=1)

    # Left eye — dim dot
    lex = cx - 38
    ley = cy - 60
    draw.ellipse([lex - 4, ley - 4, lex + 4, ley + 4], fill=CRIMSON_DEEP)

    # Nose — inverted triangle trace
    draw.line([(cx - 10, cy - 22), (cx + 10, cy - 22)], fill=CRIMSON_DEEP, width=2)
    draw.line([(cx - 10, cy - 22), (cx, cy + 2)], fill=CRIMSON_DEEP, width=2)
    draw.line([(cx + 10, cy - 22), (cx, cy + 2)], fill=CRIMSON_DEEP, width=2)

    # Teeth — vertical trace lines
    for i in range(-3, 4):
        tx = cx + i * 14
        draw.line([(tx, cy + 38), (tx, cy + 68)], fill=CRIMSON_DEEP, width=2)
    draw.line([(cx - 42, cy + 38), (cx + 42, cy + 38)], fill=CRIMSON_DEEP, width=2)
    draw.line([(cx - 35, cy + 68), (cx + 35, cy + 68)], fill=CRIMSON_DEEP, width=2)

    # Circuit traces across skull
    trace_lines = [
        [(cx - 70, cy - 100), (cx + 70, cy - 100)],
        [(cx - 75, cy - 75), (cx + 75, cy - 75)],
        [(cx - 80, cy - 50), (cx + 80, cy - 50)],
    ]
    for p1, p2 in trace_lines:
        draw.line([p1, p2], fill=(80, 0, 0), width=1)

    # Vertical traces
    for offset in [-50, -25, 0, 25, 50]:
        draw.line([(cx + offset, cy - 120), (cx + offset, cy - 25)], fill=(80, 0, 0), width=1)

    # Circuit nodes
    rng = random.Random(44)
    for _ in range(12):
        nx = cx + rng.randint(-60, 60)
        ny = cy + rng.randint(-115, -30)
        ns = 3
        draw.rectangle([nx - ns, ny - ns, nx + ns, ny + ns], fill=CRIMSON_DEEP, outline=(100, 0, 0))

    # Glitch effect — small horizontal displacement lines
    for _ in range(5):
        gy = cy + rng.randint(-100, 50)
        gx = cx + rng.randint(-60, 60)
        draw.line([(gx, gy), (gx + rng.randint(10, 30), gy)], fill=CRIMSON_BRIGHT, width=1)

    # Monospace subtitle
    font_mono = get_mono_font(16)
    centered_text(draw, cx, cy + 100, "STATUS: ACTIVE | VISIBILITY: NULL", font_mono, CRIMSON_DEEP)

    # Title
    font_title = get_bold_font(38)
    centered_text(draw, cx, cy + 135, "THE VANGUARD", font_title, CRIMSON_DEEP)


# ============================================================
# COMPUTER WIZ — "The Royal Guard" — Angular modern shield, circuit keyhole
# ============================================================
def draw_wiz(draw, cx, cy):
    """
    Angular modern shield (not medieval) with keyhole center.
    Circuit board trace pattern etched into shield face.
    Gunmetal steel body, electric cyan glowing from keyhole
    and tracing circuit lines. Faint outward pulse of light from keyhole.
    """
    # Background panel
    panel_w, panel_h = 320, 380
    px1, py1 = cx - panel_w // 2, cy - panel_h // 2
    px2, py2 = cx + panel_w // 2, cy + panel_h // 2
    draw.rounded_rectangle(
        [px1, py1, px2, py2],
        radius=6, fill=(12, 14, 20), outline=CYAN_DIM, width=1,
    )

    # Pulse glow from keyhole center
    for r in range(20, 160, 20):
        alpha = max(10, 50 - r // 3)
        draw.ellipse(
            [cx - r, cy - 10 - r, cx + r, cy - 10 + r],
            outline=(0, alpha * 2, alpha * 2 + 20), width=1,
        )

    # Modern angular shield — sharp geometry, not rounded medieval
    shield_pts = [
        (cx, cy - 150),         # top point
        (cx + 50, cy - 145),    # top right
        (cx + 110, cy - 120),   # upper right
        (cx + 125, cy - 60),    # mid upper right
        (cx + 120, cy + 10),    # mid right
        (cx + 100, cy + 60),    # lower mid right
        (cx + 65, cy + 100),    # lower right
        (cx, cy + 140),         # bottom point
        (cx - 65, cy + 100),
        (cx - 100, cy + 60),
        (cx - 120, cy + 10),
        (cx - 125, cy - 60),
        (cx - 110, cy - 120),
        (cx - 50, cy - 145),
    ]

    # Shield body
    draw.polygon(shield_pts, fill=GUNMETAL, outline=ELECTRIC_CYAN, width=2)

    # Inner shield panel
    inner_scale = 0.8
    inner_pts = [
        (cx + int((x - cx) * inner_scale), cy + int((y - cy) * inner_scale))
        for x, y in shield_pts
    ]
    draw.polygon(inner_pts, fill=(55, 60, 72), outline=CYAN_DIM, width=1)

    # Circuit board traces etched into shield face
    trace_color = ELECTRIC_CYAN
    # Horizontal traces
    for offset_y in [-80, -40, 0, 40, 80]:
        hw = 90 - abs(offset_y) // 2
        draw.line([(cx - hw, cy + offset_y), (cx + hw, cy + offset_y)],
                  fill=trace_color, width=1)
    # Vertical traces
    for offset_x in [-60, -30, 30, 60]:
        vh = 80 - abs(offset_x) // 2
        draw.line([(cx + offset_x, cy - vh), (cx + offset_x, cy + vh)],
                  fill=trace_color, width=1)

    # Circuit nodes at intersections
    for ox in [-60, -30, 0, 30, 60]:
        for oy in [-80, -40, 0, 40, 80]:
            if abs(ox) + abs(oy) < 130:
                ns = 2
                draw.rectangle(
                    [cx + ox - ns, cy + oy - ns, cx + ox + ns, cy + oy + ns],
                    fill=ELECTRIC_CYAN,
                )

    # Keyhole — circle on top, tapered slot below
    kh_cy = cy - 10
    # Outer keyhole ring — cyan glow
    draw.ellipse(
        [cx - 32, kh_cy - 32, cx + 32, kh_cy + 32],
        fill=(15, 20, 30), outline=ELECTRIC_CYAN, width=3,
    )
    # Inner keyhole circle
    draw.ellipse(
        [cx - 16, kh_cy - 16, cx + 16, kh_cy + 16],
        fill=(5, 10, 18), outline=ELECTRIC_CYAN, width=2,
    )
    # Keyhole slot
    draw.polygon(
        [
            (cx - 10, kh_cy + 10),
            (cx + 10, kh_cy + 10),
            (cx + 5, kh_cy + 55),
            (cx - 5, kh_cy + 55),
        ],
        fill=(5, 10, 18), outline=ELECTRIC_CYAN, width=2,
    )

    # Bright cyan glow in keyhole center
    draw.ellipse([cx - 6, kh_cy - 6, cx + 6, kh_cy + 6], fill=ELECTRIC_CYAN)

    # Title
    font_title = get_bold_font(38)
    centered_text(draw, cx, cy + 175, "ROYAL GUARD", font_title, ELECTRIC_CYAN)


# ============================================================
# RUSH — "The Breacher" — Battering ram through cracked wall, scanning lines
# ============================================================
def draw_rush(draw, cx, cy):
    """
    A cracked wall with a battering ram punching through the center.
    Tactical electric green scan lines radiate from the breach point.
    Network topology nodes float around the edges — SSH tunnels visualized.
    'Every wall has a seam. I find it.'
    """
    # Background panel — dark green-black
    panel_w, panel_h = 320, 380
    px1, py1 = cx - panel_w // 2, cy - panel_h // 2
    px2, py2 = cx + panel_w // 2, cy + panel_h // 2
    draw.rounded_rectangle(
        [px1, py1, px2, py2],
        radius=6, fill=BREACH_BLACK, outline=GREEN_DIM, width=2,
    )

    # Scanning pulse rings from breach center
    for r in range(20, 180, 22):
        alpha = max(10, 60 - r // 3)
        draw.ellipse(
            [cx - r, cy - 10 - r, cx + r, cy - 10 + r],
            outline=(0, alpha * 2 + 20, alpha), width=1,
        )

    # The Wall — brick-like grid pattern
    wall_x1, wall_y1 = cx - 120, cy - 120
    wall_x2, wall_y2 = cx + 120, cy + 80
    brick_h = 25
    brick_w = 50
    wall_color = (45, 50, 45)
    mortar_color = (25, 30, 25)

    # Draw bricks
    row = 0
    for by in range(wall_y1, wall_y2, brick_h):
        offset = (brick_w // 2) if row % 2 else 0
        for bx in range(wall_x1 - brick_w, wall_x2 + brick_w, brick_w):
            bx_off = bx + offset
            draw.rectangle(
                [bx_off + 1, by + 1, bx_off + brick_w - 1, by + brick_h - 1],
                fill=wall_color, outline=mortar_color, width=1,
            )
        row += 1

    # Breach hole — jagged crack radiating from center
    breach_cx, breach_cy = cx, cy - 20
    rng = random.Random(46)
    crack_segments = []
    for i in range(12):
        angle = math.radians(i * 30)
        inner_r = rng.randint(15, 25)
        outer_r = rng.randint(35, 65)
        ix = breach_cx + int(inner_r * math.cos(angle))
        iy = breach_cy + int(inner_r * math.sin(angle))
        ox = breach_cx + int(outer_r * math.cos(angle))
        oy = breach_cy + int(outer_r * math.sin(angle))
        crack_segments.append(((ix, iy), (ox, oy)))
        # Draw crack line
        draw.line([(ix, iy), (ox, oy)], fill=TACTICAL_GREEN, width=2)
        # Glow at tip
        draw.ellipse([ox - 3, oy - 3, ox + 3, oy + 3], fill=TACTICAL_GREEN)

    # Breach hole center — dark void with green ring
    draw.ellipse(
        [breach_cx - 25, breach_cy - 25, breach_cx + 25, breach_cy + 25],
        fill=(2, 4, 2), outline=TACTICAL_GREEN, width=3,
    )
    # Inner glow
    draw.ellipse(
        [breach_cx - 10, breach_cy - 10, breach_cx + 10, breach_cy + 10],
        fill=TACTICAL_GREEN,
    )

    # Battering ram — horizontal bar punching through
    ram_y = breach_cy
    ram_x1 = cx - 140
    ram_x2 = breach_cx - 20
    # Ram shaft
    draw.rectangle(
        [ram_x1, ram_y - 8, ram_x2, ram_y + 8],
        fill=(60, 65, 60), outline=GREEN_DIM, width=1,
    )
    # Ram head — pointed
    draw.polygon(
        [(ram_x2, ram_y - 14), (ram_x2 + 22, ram_y), (ram_x2, ram_y + 14)],
        fill=TACTICAL_GREEN, outline=(200, 255, 200),
    )
    # Ram grip lines
    for gx in range(ram_x1 + 10, ram_x2 - 10, 15):
        draw.line([(gx, ram_y - 6), (gx, ram_y + 6)], fill=GREEN_DIM, width=1)

    # Network topology nodes — SSH tunnels around the edges
    node_positions = [
        (cx - 130, cy - 140), (cx + 130, cy - 140),
        (cx - 140, cy + 40), (cx + 140, cy + 40),
        (cx - 100, cy - 80), (cx + 100, cy - 80),
        (cx - 90, cy + 70), (cx + 90, cy + 70),
    ]
    for nx, ny in node_positions:
        draw.rectangle([nx - 5, ny - 5, nx + 5, ny + 5], fill=GREEN_DARK, outline=TACTICAL_GREEN, width=1)
    # Connect nodes with tunnel lines
    for i in range(0, len(node_positions) - 1, 2):
        n1 = node_positions[i]
        n2 = node_positions[i + 1]
        draw.line([n1, n2], fill=GREEN_DIM, width=1)
    # Connect some nodes to breach center
    for nx, ny in node_positions[:4]:
        # Dashed effect
        steps = 15
        for s in range(steps):
            if s % 2 == 0:
                t1 = s / steps
                t2 = (s + 1) / steps
                lx1 = nx + (breach_cx - nx) * t1
                ly1 = ny + (breach_cy - ny) * t1
                lx2 = nx + (breach_cx - nx) * t2
                ly2 = ny + (breach_cy - ny) * t2
                draw.line([(lx1, ly1), (lx2, ly2)], fill=GREEN_DIM, width=1)

    # Horizontal scan lines across the panel (hacker aesthetic)
    for sy in range(py1 + 10, py2 - 10, 8):
        alpha = rng.randint(5, 20)
        draw.line([(px1 + 5, sy), (px2 - 5, sy)], fill=(0, alpha, 0), width=1)

    # Monospace subtitle
    font_mono = get_mono_font(16)
    centered_text(draw, cx, cy + 100, "Every wall has a seam. I find it.", font_mono, GREEN_DIM)

    # Title
    font_title = get_bold_font(38)
    centered_text(draw, cx, cy + 135, "THE BREACHER", font_title, TACTICAL_GREEN)


# ============================================================
# THE PALACE title at the bottom
# ============================================================
def draw_palace_title(draw):
    cx = W // 2
    # Decorative line
    line_y = H - 180
    line_half = 450
    draw.line([(cx - line_half, line_y), (cx + line_half, line_y)],
              fill=GOLD_DIM, width=2)

    # Diamond accent at center
    ds = 8
    draw.polygon([(cx, line_y - ds), (cx + ds, line_y), (cx, line_y + ds), (cx - ds, line_y)],
                 fill=GOLD)

    # End accents
    for side in [-1, 1]:
        ex = cx + side * line_half
        draw.polygon([(ex, line_y - 6), (ex + side * 12, line_y), (ex, line_y + 6)], fill=GOLD)

    # THE PALACE text
    font_palace = get_bold_font(84)
    centered_text(draw, cx, H - 115, "THE PALACE", font_palace, GOLD)

    # Subtitle
    font_sub = get_font(30)
    centered_text(draw, cx, H - 50, "Stone AI Command Infrastructure", font_sub, GOLD_DIM)


# ============================================================
# Connection lines from founder to each head
# ============================================================
def draw_connections(draw, founder_pos, positions):
    fcx, fcy = founder_pos
    for px, py in positions:
        steps = 50
        for i in range(steps):
            t = i / steps
            x = fcx + (px - fcx) * t
            y = fcy + (py - fcy) * t
            if i % 3 != 0:
                draw.ellipse([x - 1, y - 1, x + 1, y + 1], fill=GOLD_DIM)


# ============================================================
# MAIN
# ============================================================
def main():
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)

    # Background
    gradient_bg(draw)

    # Layout positions
    founder_cx, founder_cy = W // 2, 280

    # Five figures arranged below: 3 Heads + 2 Royal Guards
    row_cy = 1050
    spacing = W // 6
    stone_cx = spacing * 1
    cardinal_cx = spacing * 2
    chaos_cx = spacing * 3
    wiz_cx = spacing * 4
    rush_cx = spacing * 5

    positions = [
        (stone_cx, row_cy),
        (cardinal_cx, row_cy),
        (chaos_cx, row_cy),
        (wiz_cx, row_cy),
        (rush_cx, row_cy),
    ]

    # Connection lines
    draw_connections(draw, (founder_cx, founder_cy + 100), positions)

    # Draw everything
    draw_founder(draw, founder_cx, founder_cy)
    draw_stone(draw, stone_cx, row_cy)
    draw_cardinal(draw, cardinal_cx, row_cy)
    draw_chaos(draw, chaos_cx, row_cy)
    draw_wiz(draw, wiz_cx, row_cy)
    draw_rush(draw, rush_cx, row_cy)

    # THE PALACE title
    draw_palace_title(draw)

    # Name labels above each identity
    font_name = get_bold_font(36)
    name_y = row_cy - 230
    centered_text(draw, stone_cx, name_y, "STONE", font_name, CHARCOAL)
    centered_text(draw, cardinal_cx, name_y, "CARDINAL", font_name, COLD_SILVER)
    centered_text(draw, chaos_cx, name_y, "CHAOS", font_name, CRIMSON_DEEP)
    centered_text(draw, wiz_cx, name_y, "COMPUTER WIZ", font_name, ELECTRIC_CYAN)
    centered_text(draw, rush_cx, name_y, "RUSH", font_name, TACTICAL_GREEN)

    # Head numbers / roles
    font_num = get_font(22)
    num_y = name_y + 38
    centered_text(draw, stone_cx, num_y, "The Owner", font_num, WHITE_DIM)
    centered_text(draw, cardinal_cx, num_y, "The Architect", font_num, WHITE_DIM)
    centered_text(draw, chaos_cx, num_y, "The Vanguard", font_num, WHITE_DIM)
    centered_text(draw, wiz_cx, num_y, "Royal Guard", font_num, WHITE_DIM)
    centered_text(draw, rush_cx, num_y, "Royal Guard", font_num, WHITE_DIM)

    # Save
    img.save(OUTPUT, "PNG", optimize=True)
    print(f"Wallpaper saved to: {OUTPUT}")
    print(f"Resolution: {W}x{H}")


if __name__ == "__main__":
    main()
