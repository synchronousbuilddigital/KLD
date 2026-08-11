export function generateCardboardCanvas(materialCategory, packageColor) {
  if (typeof window === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  let hex = "#C6A075"; // kraft
  if (materialCategory === "white_paperboard" || materialCategory === "art_paper") hex = "#ffffff";
  if (materialCategory === "corrugated") hex = "#c19a6b";
  if (materialCategory === "kraft_paperboard") hex = "#cbab7d";
  
  if (packageColor && packageColor !== "transparent") {
    hex = packageColor;
  }

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 1024, 1024);

  // No noise for glossy/smooth white paperboard
  if (materialCategory === "white_paperboard" || materialCategory === "art_paper") {
    return canvas; 
  }

  // Generate organic fiber noise for kraft/corrugated
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const length = Math.random() * 5 + 2;
    const angle = Math.random() * Math.PI * 2;
    
    // Mix of dark flecks and light fibers
    const isDark = Math.random() > 0.4;
    ctx.strokeStyle = isDark ? "rgba(0, 0, 0, 0.035)" : "rgba(255, 255, 255, 0.045)";
    ctx.lineWidth = Math.random() * 0.8 + 0.2;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  // Soft overall noise
  const noiseData = ctx.getImageData(0, 0, 1024, 1024);
  const data = noiseData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(noiseData, 0, 0);

  return canvas;
}
