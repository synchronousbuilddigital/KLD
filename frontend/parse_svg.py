import re
import os

svg_path = r"C:\Users\yashg\Downloads\folder2\folder2\cosmetic_2\2_cosmetic_box_b.svg"
js_path = r"src\lib\cosmeticBoxBDielineGenerator.js"

with open(svg_path, 'r', encoding='utf-8') as f:
    svg_content = f.read()

def parse_layer(layer_name):
    match = re.search(r'<g lc:layername="' + layer_name + r'".*?>(.*?)</g>', svg_content, re.DOTALL)
    if not match:
        return []
    layer_content = match.group(1)
    
    segments = []
    
    for line_match in re.finditer(r'<line\s+x1="([^"]+)"\s+y1="([^"]+)"\s+x2="([^"]+)"\s+y2="([^"]+)"', layer_content):
        x1, y1, x2, y2 = map(float, line_match.groups())
        segments.append([x1, y1, x2, y2])
        
    for path_match in re.finditer(r'<path\s+d="([^"]+)"', layer_content):
        d = path_match.group(1).strip()
        points = []
        for cmd in d.split():
            if cmd.startswith('M') or cmd.startswith('L'):
                x, y = map(float, cmd[1:].split(','))
                points.append((x, y))
        for i in range(len(points)-1):
            segments.append([points[i][0], points[i][1], points[i+1][0], points[i+1][1]])
            
    return segments

# The SVG seems to have two block references (e.g. *U1 and traditional).
# We want the 'traditional' block or just extract globally.
# Actually, let's just extract all lines and paths inside the entire SVG that belong to layers cuts/folds.
def parse_layer_global(layer_name):
    segments = []
    # Find all groups with this layer name
    for match in re.finditer(r'<g lc:layername="' + layer_name + r'".*?>(.*?)</g>', svg_content, re.DOTALL):
        layer_content = match.group(1)
        for line_match in re.finditer(r'<line\s+x1="([^"]+)"\s+y1="([^"]+)"\s+x2="([^"]+)"\s+y2="([^"]+)"', layer_content):
            x1, y1, x2, y2 = map(float, line_match.groups())
            segments.append([x1, y1, x2, y2])
            
        for path_match in re.finditer(r'<path\s+d="([^"]+)"', layer_content):
            d = path_match.group(1).strip()
            points = []
            for cmd in d.split():
                if cmd.startswith('M') or cmd.startswith('L'):
                    x, y = map(float, cmd[1:].split(','))
                    points.append((x, y))
            for i in range(len(points)-1):
                segments.append([points[i][0], points[i][1], points[i+1][0], points[i+1][1]])
    return segments

cut_segments = parse_layer_global('cuts')
fold_segments = parse_layer_global('folds')

cuts_js = "const CUT_SEGMENTS = [\n" + ",\n".join([f"  [{s[0]},{s[1]},{s[2]},{s[3]}]" for s in cut_segments]) + "\n];"
folds_js = "const FOLD_SEGMENTS = [\n" + ",\n".join([f"  [{s[0]},{s[1]},{s[2]},{s[3]}]" for s in fold_segments]) + "\n];"

with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace CUT_SEGMENTS
js_content = re.sub(r'const CUT_SEGMENTS = \[.*?\];', cuts_js, js_content, flags=re.DOTALL)
# Replace FOLD_SEGMENTS
js_content = re.sub(r'const FOLD_SEGMENTS = \[.*?\];', folds_js, js_content, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Extracted {len(cut_segments)} cuts and {len(fold_segments)} folds. Updated {js_path}")
