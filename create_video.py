import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg
import subprocess

# Paths
base_dir = r"c:\APPS-DEV\zzz"
output_video = os.path.join(base_dir, "recorrido_villalbilla_homes.mp4")
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

# Images to assemble with cinematic camera motion
# 1. Front entrance with inverted double gates, Pergola, Kia & KTM (AI Render)
img_front = os.path.join(base_dir, "extracted_pages", "render_acceso_vehiculos_swapped.jpg")
# 2. Rear garden with Minihuerta & flowers (AI Render)
img_rear = os.path.join(base_dir, "extracted_pages", "render_jardin_minihuerta.jpg")
# 3. Dossier Cover
img_dossier_cover = os.path.join(base_dir, "extracted_pages", "Dossier_page_01.png")
# 4. Blueprint A4
img_plan = os.path.join(base_dir, "extracted_pages", "A4_plan_page_01.png")
# 5. Section A3
img_section = os.path.join(base_dir, "extracted_pages", "A3_plan_page_01.png")

scenes = [
    {
        "img": img_dossier_cover,
        "title": "VILLALBILLA HOMES",
        "subtitle": "20 Viviendas Unifamiliares VPPL | Vértice 86",
        "badge": "MEMORIA DEL PROYECTO",
        "pan": "zoom_in",
        "duration": 4.0
    },
    {
        "img": img_front,
        "title": "DOBLE ACCESO (11.50 M) Y PERGOLA DE APARCAMIENTO",
        "subtitle": "Patio de 80 m² con cancel vehicular, puerta peatonal, KTM 1290 y Kia Sportage",
        "badge": "DIMENSIONES REALES DEL PLANO A3 (11.50 M DE FONDO)",
        "pan": "pan_right",
        "duration": 5.5
    },
    {
        "img": img_plan,
        "title": "DISTRIBUCION ARQUITECTONICA OFICIAL",
        "subtitle": "Planta Baja (62.5m²) | Planta Primera (62.5m²) | Buhardilla (23m²)",
        "badge": "PLANOS A4 - 148 m² UTILES",
        "pan": "pan_left",
        "duration": 5.0
    },
    {
        "img": img_rear,
        "title": "JARDIN PRIVADO (36 m²) Y MINIHUERTA",
        "subtitle": "Bancales elevados de madera con hortalizas, tomateras y flores de lavanda",
        "badge": "MINIHUERTA URBANA & OASIS FLORAL",
        "pan": "zoom_in",
        "duration": 5.5
    },
    {
        "img": img_section,
        "title": "SECCION CONSTRUCTIVA Y ALTURAS",
        "subtitle": "Altura libre de 2.70 m por planta | Cubierta inclinada a 30°",
        "badge": "SECCION A3 - COTAS EXACTAS",
        "pan": "zoom_out",
        "duration": 5.0
    },
    {
        "img": img_front,
        "title": "VILLALBILLA HOMES - TU NUEVO HOGAR",
        "subtitle": "Confort, Aerotermia, Diseño y Amplitud para tu Familia",
        "badge": "CALIDAD & EFICIENCIA ENERGETICA A",
        "pan": "zoom_out",
        "duration": 4.5
    }
]

WIDTH, HEIGHT = 1920, 1080
FPS = 30

def create_frame(im_pil, title, subtitle, badge, crop_box):
    cropped = im_pil.crop(crop_box).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(cropped)

    # Top-to-bottom subtle vignette / gradient for overlay text
    # Draw bottom dark gradient bar
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_overlay = ImageDraw.Draw(overlay)
    
    # Bottom banner
    d_overlay.rectangle([(0, HEIGHT - 220), (WIDTH, HEIGHT)], fill=(11, 15, 25, 230))
    # Top header bar
    d_overlay.rectangle([(0, 0), (WIDTH, 90)], fill=(11, 15, 25, 200))
    
    cropped = Image.alpha_composite(cropped.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(cropped)

    # Header text
    try:
        font_header = ImageFont.truetype("arialbd.ttf", 26)
        font_badge = ImageFont.truetype("arialbd.ttf", 20)
        font_title = ImageFont.truetype("arialbd.ttf", 46)
        font_sub = ImageFont.truetype("arial.ttf", 28)
    except:
        font_header = font_badge = font_title = font_sub = ImageFont.load_default()

    draw.text((60, 30), "VILLALBILLA HOMES | RECORRIDO VIRTUAL 3D", fill=(255, 255, 255, 255), font=font_header)
    
    # Badge
    draw.rounded_rectangle([(60, HEIGHT - 190), (60 + len(badge)*14 + 30, HEIGHT - 150)], radius=8, fill=(37, 99, 235, 230))
    draw.text((75, HEIGHT - 182), badge, fill=(255, 255, 255, 255), font=font_badge)

    # Title & Subtitle
    draw.text((60, HEIGHT - 135), title, fill=(255, 255, 255, 255), font=font_title)
    draw.text((60, HEIGHT - 75), subtitle, fill=(148, 163, 184, 255), font=font_sub)

    return np.array(cropped.convert("RGB")).tobytes()

# Setup raw video pipe to ffmpeg
cmd = [
    ffmpeg_exe,
    "-y",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-s", f"{WIDTH}x{HEIGHT}",
    "-pix_fmt", "rgb24",
    "-r", str(FPS),
    "-i", "-",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    output_video
]

process = subprocess.Popen(cmd, stdin=subprocess.PIPE)

print("Rendering cinematic video frames...")

for s_idx, sc in enumerate(scenes):
    print(f"Generating scene {s_idx+1}/{len(scenes)}: {sc['title']}...")
    im = Image.open(sc["img"]).convert("RGB")
    im_w, im_h = im.size

    num_frames = int(sc["duration"] * FPS)
    
    # Target aspect ratio
    aspect = WIDTH / HEIGHT

    for f in range(num_frames):
        t = f / float(num_frames) # 0.0 to 1.0

        if sc["pan"] == "zoom_in":
            scale = 1.0 - 0.15 * t
        elif sc["pan"] == "zoom_out":
            scale = 0.85 + 0.15 * t
        else:
            scale = 0.9

        crop_w = int(im_w * scale)
        crop_h = int(crop_w / aspect)
        if crop_h > im_h:
            crop_h = im_h
            crop_w = int(crop_h * aspect)

        if sc["pan"] == "pan_right":
            x_offset = int((im_w - crop_w) * t)
            y_offset = (im_h - crop_h) // 2
        elif sc["pan"] == "pan_left":
            x_offset = int((im_w - crop_w) * (1.0 - t))
            y_offset = (im_h - crop_h) // 2
        else:
            x_offset = (im_w - crop_w) // 2
            y_offset = (im_h - crop_h) // 2

        crop_box = (x_offset, y_offset, x_offset + crop_w, y_offset + crop_h)
        frame_bytes = create_frame(im, sc["title"], sc["subtitle"], sc["badge"], crop_box)
        process.stdin.write(frame_bytes)

process.stdin.close()
process.wait()
print(f"VIDEO EXPORTED SUCCESSFULLY TO: {output_video}!")
print(f"File size: {os.path.getsize(output_video)} bytes")
