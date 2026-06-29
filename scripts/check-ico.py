from PIL import Image

ico_path = r"d:\workspace\java\myCalculator\build\icon.ico"
with Image.open(ico_path) as ico:
    print('Format:', ico.format)
    print('Size:', ico.size)
    print('Info:', ico.info)
    # 遍历所有帧/尺寸
    frame = 0
    while True:
        print(f'Frame {frame}: {ico.size}')
        frame += 1
        try:
            ico.seek(frame)
        except EOFError:
            break
