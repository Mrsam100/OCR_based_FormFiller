import asyncio
import winocr
from PIL import Image
from backend.parser import parse_bank_details

def reconstruct_spatial_lines(res):
    words = []
    for line in res.lines:
        for w in line.words:
            words.append({
                'text': w.text,
                'x': w.bounding_rect.x,
                'y': w.bounding_rect.y,
                'w': w.bounding_rect.width,
                'h': w.bounding_rect.height
            })
    words.sort(key=lambda item: (item['y'], item['x']))
    rows = []
    for w in words:
        placed = False
        for row in rows:
            if abs(row['y_avg'] - w['y']) < 14:
                row['words'].append(w)
                row['y_avg'] = sum(x['y'] for x in row['words']) / len(row['words'])
                placed = True
                break
        if not placed:
            rows.append({'y_avg': w['y'], 'words': [w]})
    rows.sort(key=lambda r: r['y_avg'])
    text_lines = []
    for r in rows:
        r['words'].sort(key=lambda w: w['x'])
        text_lines.append(' '.join(w['text'] for w in r['words']))
    return text_lines, words

async def test_all():
    samples = ['sbi', 'hdfc', 'icici', 'pnb', 'axis']
    for s in samples:
        path = f'static/samples/{s}_passbook.png'
        img = Image.open(path)
        res = await winocr.recognize_pil(img)
        lines, words = reconstruct_spatial_lines(res)
        p = parse_bank_details(res.text, lines)
        print(f"=== {s.upper()} ===")
        print(f"Bank: {p.get('bank_name')}")
        print(f"Holder: {p.get('account_holder')}")
        print(f"A/C: {p.get('account_number')}")
        print(f"IFSC: {p.get('ifsc_code')}")
        print(f"CIF: {p.get('cif_number')}")
        print(f"MICR: {p.get('micr_code')}")
        print(f"Branch: {p.get('branch_name')}")
        print(f"Type: {p.get('account_type')}")
        print(f"Address: {p.get('address')}")
        print(f"Mobile: {p.get('mobile')}")
        print(f"Email: {p.get('email')}")
        print()

if __name__ == "__main__":
    asyncio.run(test_all())
