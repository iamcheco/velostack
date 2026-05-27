import fitz
import os
from PIL import Image
import io

pdf_path = r"d:\Downloads\Telegram Desktop\Bo Burnham - Egghead.pdf"
out_dir = r"c:\Users\Vedansh\OneDrive\velostack\public\egghead"
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)

pages_to_extract = [2, 6, 9, 14, 15, 24, 28, 30, 34, 39, 41, 45, 54]

def process_image(img_bytes, filename):
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # Make white (or close to white) pixels transparent
    for item in data:
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop the transparent borders
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(filename, "PNG")

for p_num in pages_to_extract:
    try:
        page = doc.load_page(p_num - 1)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        filename = os.path.join(out_dir, f"drawing_{p_num}.png")
        process_image(pix.tobytes("png"), filename)
        print(f"Saved {filename}")
    except Exception as e:
        print(f"Error on page {p_num}: {e}")
