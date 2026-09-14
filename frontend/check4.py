import re
with open('src/lib/cosmeticBoxBDielineGenerator.js', 'r') as f:
    c = f.read()

m = re.search(r'const CUT_SEGMENTS = (\[.*?\]);', c, re.DOTALL)
if m:
    for item in re.findall(r'\"([^\"]*)\"', m.group(1)):
        if 'C' in item or 'Q' in item or 'A' in item or 'S' in item or 'c' in item or 'q' in item or 'a' in item or 's' in item:
            print('Curve found:', item)
