import re
with open('cosmeticBoxBDielineGenerator.js', 'r') as f:
    c = f.read()

c = re.sub(r'"M140\.49999978,328\.49999966[^"]+L140\.5,66\.9999995"', '"M 140.5 328.5 L 140.5 147.0 Q 113.5 147.0 113.5 67.0 L 140.5 67.0"', c)
c = re.sub(r'"M410\.50000022,66\.99999934[^"]+L410\.5,328\.4999995"', '"M 410.5 67.0 L 437.5 67.0 Q 437.5 147.0 410.5 147.0 L 410.5 328.5"', c)

with open('cosmeticBoxBDielineGenerator.js', 'w') as f:
    f.write(c)
print("Replaced")
