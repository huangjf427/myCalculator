from PIL import Image, ImageDraw, ImageFont
import os

size = 1024
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

bg_color = (30, 58, 95, 255)      # 深蓝
accent_color = (212, 175, 55, 255) # 金色
corner_radius = 180

# 圆角矩形背景
draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=bg_color)

# 加载字体
def load_font(size):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/tahomabd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

font = load_font(700)
text = "W"
bbox = draw.textbbox((0, 0), text, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]
x = (size - text_w) // 2
y = (size - text_h) // 2 - 60

# 绘制 W
draw.text((x, y), text, font=font, fill=accent_color)

# 绘制底部上升折线
line_y = y + text_h + 100
points = [
    (260, line_y),
    (420, line_y - 90),
    (580, line_y + 30),
    (764, line_y - 130),
]
# 描边让线条更粗
for offset in range(-10, 11, 5):
    shifted = [(p[0], p[1] + offset) for p in points]
    draw.line(shifted, fill=accent_color, width=20, joint="curve")

# 保存 PNG
png_path = r"d:\workspace\java\myCalculator\build\icon.png"
img.save(png_path)

# 生成 ICO（多尺寸）
ico_path = r"d:\workspace\java\myCalculator\build\icon.ico"
sizes = [16, 32, 48, 64, 128, 256]
imgs = [img.resize((s, s), Image.LANCZOS) for s in sizes]
imgs[0].save(
    ico_path,
    format='ICO',
    sizes=[(i.width, i.height) for i in imgs],
    append_images=imgs[1:],
)

print(f"Generated {png_path} and {ico_path}")
