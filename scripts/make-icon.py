from PIL import Image, ImageDraw, ImageFont
import os

size = 1024
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

bg_color = (30, 58, 95, 255)       # 深蓝
accent_color = (212, 175, 55, 255) # 金色
corner_radius = size // 6

# 圆角矩形背景
draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=bg_color)

# 加载字体
def load_font(font_size):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/tahomabd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, font_size)
    return ImageFont.load_default()

font = load_font(size // 2)
text = "W"
bbox = draw.textbbox((0, 0), text, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]
x = (size - text_w) // 2
y = (size - text_h) // 2 - size // 16

# 绘制 W
draw.text((x, y), text, font=font, fill=accent_color)

# 绘制底部上升折线
line_y = y + text_h + size // 12
points = [
    (size // 5, line_y),
    (size * 2 // 5, line_y - size // 8),
    (size * 3 // 5, line_y + size // 16),
    (size * 4 // 5, line_y - size // 6),
]
line_width = max(2, size // 50)
for offset in range(-line_width, line_width + 1, max(1, line_width // 2)):
    shifted = [(p[0], p[1] + offset) for p in points]
    draw.line(shifted, fill=accent_color, width=line_width, joint="curve")

base = r"d:\workspace\java\myCalculator\build\icon"

# 保存多尺寸 PNG
img.save(f"{base}_1024.png")
img.resize((512, 512), Image.LANCZOS).save(f"{base}_512.png")
img.resize((256, 256), Image.LANCZOS).save(f"{base}_256.png")

# favicon 使用 256x256
img.resize((256, 256), Image.LANCZOS).save(r"d:\workspace\java\myCalculator\public\icon.png")

# 生成 ICO（Windows 标准最大 256x256）
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
img.save(f"{base}.ico", format='ICO', sizes=ico_sizes)

print(f"Generated icons: {base}_1024.png, {base}_512.png, {base}_256.png, {base}.ico")
