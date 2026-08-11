export function generateCakeBoxDieline(dimensions, options = {}) {
  const mm = (v) => v / 25.4;

  const {
    L, W, H, T: paramT, glueFlapWidth,
    width = mm(120),
    length = mm(110),
    height = mm(220),
    t = mm(0.5),
    bleed = mm(3),
    includeDimensions = true,
    windowDecals = []
  } = dimensions;

  // In packaging, L = Front (Longer), W = Side (Shorter).
  const nL = parseFloat(L || length);
  const nW = parseFloat(W || width);
  const nH = parseFloat(H || height);
  const nGlue = parseFloat(glueFlapWidth || mm(15));

  // Panels: 1(L: Front), 2(W: Side), 3(L: Back), 4(W: Side)
  const x0 = 0;
  const x1 = nGlue;
  const x2 = x1 + nL;
  const x3 = x2 + nW;
  const x4 = x3 + nL;
  const x5 = x4 + nW;

  // DITTO COPY from SVG: Scale factor based on original CAD L=220mm
  const svgScale = nL / 220.0;
  // SVG top handle goes from Y=238.509 (crease) up to Y=315.509
  const handleH = (315.509 - 238.509) * svgScale;
  const yTop = handleH;
  const yBot = yTop + nH;

  // Mapping function for all Y coordinates in the top section
  const mapSvgY = (svgY) => yTop - (svgY - 238.509) * svgScale;

  const d = nW; // Full width for deep bottom flaps to match reference
  const d2 = nW * 0.7; // 70% depth for auto-lock side flaps
  const bottomDeep = Math.max(d, d2);
  const canvasWidth = x5 + mm(10);
  const canvasHeight = yBot + bottomDeep + mm(10);

  let cutPaths = [];
  let foldLines = [];

  // GLUE FLAP
  function gluePath() {
    const taper = Math.min(mm(5), nH * 0.05);
    // SVG glue flap ends at Y=196.963 (below top crease)
    const topY = mapSvgY(196.963);
    return `M ${x1},${yBot} ` +
      `L ${x0 + taper},${yBot - taper} ` +
      `L ${x0 + taper},${topY + taper} ` +
      `L ${x1},${topY}`;
  }

  // ROOF TAB (W panels) - Ditto copy from SVG
  function topGablePathP1(startX, pWidth) {
    const s = pWidth / 110.0; // Panel 2 width in SVG is 110
    const mapX = (svgX) => startX + (svgX - 245) * s;

    let path = `L ${startX},${yTop} ` +
      `L ${mapX(244.567)},${mapSvgY(197.213)} ` +
      `C ${mapX(244.656)},${mapSvgY(197.059)} ${mapX(244.821)},${mapSvgY(196.963)} ${mapX(245)},${mapSvgY(196.963)} ` +
      `C ${mapX(245.098)},${mapSvgY(196.963)} ${mapX(245.193)},${mapSvgY(196.992)} ${mapX(245.275)},${mapSvgY(197.045)} ` +
      `C ${mapX(245.356)},${mapSvgY(197.099)} ${mapX(245.42)},${mapSvgY(197.175)} ${mapX(245.459)},${mapSvgY(197.265)} ` +
      `L ${mapX(283.477)},${mapSvgY(285.224)} ` +
      `C ${mapX(285.346)},${mapSvgY(289.548)} ${mapX(288.836)},${mapSvgY(292.966)} ${mapX(293.196)},${mapSvgY(294.747)} ` +
      `C ${mapX(297.557)},${mapSvgY(296.527)} ${mapX(302.443)},${mapSvgY(296.527)} ${mapX(306.804)},${mapSvgY(294.747)} ` +
      `C ${mapX(311.164)},${mapSvgY(292.966)} ${mapX(314.654)},${mapSvgY(289.548)} ${mapX(316.523)},${mapSvgY(285.224)} ` +
      `L ${mapX(354.541)},${mapSvgY(197.265)} ` +
      `C ${mapX(354.58)},${mapSvgY(197.175)} ${mapX(354.644)},${mapSvgY(197.099)} ${mapX(354.725)},${mapSvgY(197.045)} ` +
      `C ${mapX(354.807)},${mapSvgY(196.992)} ${mapX(354.902)},${mapSvgY(196.963)} ${mapX(355)},${mapSvgY(196.963)} ` +
      `L ${startX + pWidth},${yTop}`;

    let slotPath = `M ${mapX(298.5)},${mapSvgY(237.228)} ` +
      `L ${mapX(298.5)},${mapSvgY(274.582)} ` +
      `C ${mapX(298.5)},${mapSvgY(275.118)} ${mapX(298.786)},${mapSvgY(275.613)} ${mapX(299.25)},${mapSvgY(275.881)} ` +
      `C ${mapX(299.714)},${mapSvgY(276.149)} ${mapX(300.286)},${mapSvgY(276.149)} ${mapX(300.75)},${mapSvgY(275.881)} ` +
      `C ${mapX(301.214)},${mapSvgY(275.613)} ${mapX(301.5)},${mapSvgY(275.118)} ${mapX(301.5)},${mapSvgY(274.582)} ` +
      `L ${mapX(301.5)},${mapSvgY(237.228)} ` +
      `C ${mapX(301.5)},${mapSvgY(236.692)} ${mapX(301.214)},${mapSvgY(236.197)} ${mapX(300.75)},${mapSvgY(235.929)} ` +
      `C ${mapX(300.286)},${mapSvgY(235.661)} ${mapX(299.714)},${mapSvgY(235.661)} ${mapX(299.25)},${mapSvgY(235.929)} ` +
      `C ${mapX(298.786)},${mapSvgY(236.197)} ${mapX(298.5)},${mapSvgY(236.692)} ${mapX(298.5)},${mapSvgY(237.228)} Z`;

    const slotBottomY = mapSvgY(237.228);
    return { path, slotPath, slotBottomY };
  }

  // HANDLE (L panels) - Ditto copy from SVG
  function topHandlePath(startX, pWidth) {
    const s = pWidth / 220.0; // Panel 1 width in SVG is 220
    const mapX = (svgX) => startX + (svgX - 25) * s;

    let path = `L ${startX},${yTop} ` +
      `L ${mapX(25)},${mapSvgY(196.963)} ` +
      `L ${mapX(47.235)},${mapSvgY(260.472)} ` +
      `L ${mapX(47.235)},${mapSvgY(293.472)} ` +
      `C ${mapX(47.235)},${mapSvgY(297.402)} ${mapX(49.331)},${mapSvgY(301.033)} ${mapX(52.735)},${mapSvgY(302.998)} ` +
      `C ${mapX(56.138)},${mapSvgY(304.963)} ${mapX(60.331)},${mapSvgY(304.963)} ${mapX(63.735)},${mapSvgY(302.998)} ` +
      `C ${mapX(67.138)},${mapSvgY(301.033)} ${mapX(69.235)},${mapSvgY(297.402)} ${mapX(69.235)},${mapSvgY(293.472)} ` +
      `C ${mapX(69.244)},${mapSvgY(293.404)} ${mapX(69.28)},${mapSvgY(293.344)} ${mapX(69.335)},${mapSvgY(293.304)} ` +
      `C ${mapX(69.389)},${mapSvgY(293.263)} ${mapX(69.458)},${mapSvgY(293.247)} ${mapX(69.525)},${mapSvgY(293.259)} ` +
      `C ${mapX(69.592)},${mapSvgY(293.271)} ${mapX(69.651)},${mapSvgY(293.309)} ${mapX(69.689)},${mapSvgY(293.365)} ` +
      `L ${mapX(85.045)},${mapSvgY(315.295)} ` +
      `C ${mapX(85.139)},${mapSvgY(315.429)} ${mapX(85.291)},${mapSvgY(315.509)} ${mapX(85.455)},${mapSvgY(315.509)} ` +
      `L ${mapX(184.545)},${mapSvgY(315.509)} ` +
      `C ${mapX(184.709)},${mapSvgY(315.509)} ${mapX(184.861)},${mapSvgY(315.429)} ${mapX(184.955)},${mapSvgY(315.295)} ` +
      `L ${mapX(200.311)},${mapSvgY(293.365)} ` +
      `C ${mapX(200.349)},${mapSvgY(293.309)} ${mapX(200.408)},${mapSvgY(293.271)} ${mapX(200.475)},${mapSvgY(293.259)} ` +
      `C ${mapX(200.542)},${mapSvgY(293.247)} ${mapX(200.611)},${mapSvgY(293.263)} ${mapX(200.665)},${mapSvgY(293.304)} ` +
      `C ${mapX(200.72)},${mapSvgY(293.344)} ${mapX(200.756)},${mapSvgY(293.404)} ${mapX(200.765)},${mapSvgY(293.472)} ` +
      `C ${mapX(200.765)},${mapSvgY(297.402)} ${mapX(202.862)},${mapSvgY(301.033)} ${mapX(206.265)},${mapSvgY(302.998)} ` +
      `C ${mapX(209.669)},${mapSvgY(304.963)} ${mapX(213.862)},${mapSvgY(304.963)} ${mapX(217.265)},${mapSvgY(302.998)} ` +
      `C ${mapX(220.669)},${mapSvgY(301.033)} ${mapX(222.765)},${mapSvgY(297.402)} ${mapX(222.765)},${mapSvgY(293.472)} ` +
      `L ${mapX(222.765)},${mapSvgY(260.472)} ` +
      `L ${mapX(244.567)},${mapSvgY(197.213)} ` +
      `L ${startX + pWidth},${yTop}`;

    let slotPath = `M ${mapX(98.5)},${mapSvgY(260.472)} ` +
      `L ${mapX(98.5)},${mapSvgY(279.472)} ` +
      `C ${mapX(98.5)},${mapSvgY(281.859)} ${mapX(99.448)},${mapSvgY(284.148)} ${mapX(101.136)},${mapSvgY(285.836)} ` +
      `C ${mapX(102.824)},${mapSvgY(287.524)} ${mapX(105.113)},${mapSvgY(288.472)} ${mapX(107.5)},${mapSvgY(288.472)} ` +
      `L ${mapX(162.5)},${mapSvgY(288.472)} ` +
      `C ${mapX(164.887)},${mapSvgY(288.472)} ${mapX(167.176)},${mapSvgY(287.524)} ${mapX(168.864)},${mapSvgY(285.836)} ` +
      `C ${mapX(170.552)},${mapSvgY(284.148)} ${mapX(171.5)},${mapSvgY(281.859)} ${mapX(171.5)},${mapSvgY(279.472)} ` +
      `L ${mapX(171.5)},${mapSvgY(260.472)} Z`;

    const creases = [
      { x1: mapX(47.235), y1: mapSvgY(260.472), x2: mapX(98.5), y2: mapSvgY(260.472) },
      { x1: mapX(171.5), y1: mapSvgY(260.472), x2: mapX(222.765), y2: mapSvgY(260.472) }
    ];

    return { path, slotPath, creases };
  }

  // Combine outline clockwise
  let outline = gluePath() + " ";

  const handle1 = topHandlePath(x1, nL);
  outline += handle1.path + " ";

  const roof2 = topGablePathP1(x2, nW);
  outline += roof2.path + " ";

  const handle3 = topHandlePath(x3, nL);
  outline += handle3.path + " ";

  const roof4 = topGablePathP1(x4, nW);
  outline += roof4.path + " ";

  // Right edge
  outline += `L ${x5},${yBot} `;

  // DITTO COPY Bottom Flaps from SVG (drawn right to left to form closed polygon)
  const mapX_W = (startX, svgOffset, svgX) => startX + (svgX - svgOffset) * (nW / 110.0);
  const mapX_L = (startX, svgOffset, svgX) => startX + (svgX - svgOffset) * (nL / 220.0);

  // Flap 4 (under Panel 4)
  outline += `L ${mapX_W(x4, 575, 684.5)},${mapSvgY(76.963)} ` +
    `L ${mapX_W(x4, 575, 630)},${mapSvgY(21.963)} ` +
    `L ${mapX_W(x4, 575, 630)},${mapSvgY(5.963)} ` +
    `C ${mapX_W(x4, 575, 630)},${mapSvgY(4.372)} ${mapX_W(x4, 575, 629.368)},${mapSvgY(2.846)} ${mapX_W(x4, 575, 628.243)},${mapSvgY(1.721)} ` +
    `C ${mapX_W(x4, 575, 627.117)},${mapSvgY(0.595)} ${mapX_W(x4, 575, 625.591)},${mapSvgY(-0.037)} ${mapX_W(x4, 575, 624)},${mapSvgY(-0.037)} ` +
    `L ${mapX_W(x4, 575, 575.5)},${mapSvgY(-0.037)} ` +
    `L ${mapX_W(x4, 575, 575.5)},${mapSvgY(76.663)} ` +
    `C ${mapX_W(x4, 575, 575.5)},${mapSvgY(76.771)} ${mapX_W(x4, 575, 575.465)},${mapSvgY(76.877)} ${mapX_W(x4, 575, 575.4)},${mapSvgY(76.963)} ` +
    `C ${mapX_W(x4, 575, 575.306)},${mapSvgY(77.089)} ${mapX_W(x4, 575, 575.157)},${mapSvgY(77.163)} ${mapX_W(x4, 575, 575)},${mapSvgY(77.163)} `;

  // Flap 3 (under Panel 3)
  outline += `C ${mapX_L(x3, 355, 574.843)},${mapSvgY(77.163)} ${mapX_L(x3, 355, 574.694)},${mapSvgY(77.089)} ${mapX_L(x3, 355, 574.6)},${mapSvgY(76.963)} ` +
    `L ${mapX_L(x3, 355, 519.75)},${mapSvgY(21.963)} ` +
    `L ${mapX_L(x3, 355, 519.75)},${mapSvgY(5.963)} ` +
    `C ${mapX_L(x3, 355, 519.75)},${mapSvgY(4.372)} ${mapX_L(x3, 355, 519.118)},${mapSvgY(2.846)} ${mapX_L(x3, 355, 517.993)},${mapSvgY(1.721)} ` +
    `C ${mapX_L(x3, 355, 516.867)},${mapSvgY(0.595)} ${mapX_L(x3, 355, 515.341)},${mapSvgY(-0.037)} ${mapX_L(x3, 355, 513.75)},${mapSvgY(-0.037)} ` +
    `L ${mapX_L(x3, 355, 416.25)},${mapSvgY(-0.037)} ` +
    `C ${mapX_L(x3, 355, 414.659)},${mapSvgY(-0.037)} ${mapX_L(x3, 355, 413.133)},${mapSvgY(0.595)} ${mapX_L(x3, 355, 412.007)},${mapSvgY(1.721)} ` +
    `C ${mapX_L(x3, 355, 410.882)},${mapSvgY(2.846)} ${mapX_L(x3, 355, 410.25)},${mapSvgY(4.372)} ${mapX_L(x3, 355, 410.25)},${mapSvgY(5.963)} ` +
    `L ${mapX_L(x3, 355, 410.25)},${mapSvgY(21.963)} ` +
    `L ${mapX_L(x3, 355, 355.4)},${mapSvgY(76.963)} ` +
    `C ${mapX_L(x3, 355, 355.306)},${mapSvgY(77.089)} ${mapX_L(x3, 355, 355.157)},${mapSvgY(77.163)} ${mapX_L(x3, 355, 355)},${mapSvgY(77.163)} `;

  // Flap 2 (under Panel 2)
  outline += `C ${mapX_W(x2, 245, 354.843)},${mapSvgY(77.163)} ${mapX_W(x2, 245, 354.694)},${mapSvgY(77.089)} ${mapX_W(x2, 245, 354.6)},${mapSvgY(76.963)} ` +
    `C ${mapX_W(x2, 245, 354.535)},${mapSvgY(76.877)} ${mapX_W(x2, 245, 354.5)},${mapSvgY(76.771)} ${mapX_W(x2, 245, 354.5)},${mapSvgY(76.663)} ` +
    `L ${mapX_W(x2, 245, 354.5)},${mapSvgY(-0.037)} ` +
    `L ${mapX_W(x2, 245, 306)},${mapSvgY(-0.037)} ` +
    `C ${mapX_W(x2, 245, 304.409)},${mapSvgY(-0.037)} ${mapX_W(x2, 245, 302.883)},${mapSvgY(0.595)} ${mapX_W(x2, 245, 301.757)},${mapSvgY(1.721)} ` +
    `C ${mapX_W(x2, 245, 300.632)},${mapSvgY(2.846)} ${mapX_W(x2, 245, 300)},${mapSvgY(4.372)} ${mapX_W(x2, 245, 300)},${mapSvgY(5.963)} ` +
    `L ${mapX_W(x2, 245, 300)},${mapSvgY(21.963)} ` +
    `L ${mapX_W(x2, 245, 245.4)},${mapSvgY(76.963)} ` +
    `C ${mapX_W(x2, 245, 245.306)},${mapSvgY(77.089)} ${mapX_W(x2, 245, 245.157)},${mapSvgY(77.163)} ${mapX_W(x2, 245, 245)},${mapSvgY(77.163)} `;

  // Flap 1 (under Panel 1)
  outline += `C ${mapX_L(x1, 25, 244.843)},${mapSvgY(77.163)} ${mapX_L(x1, 25, 244.694)},${mapSvgY(77.089)} ${mapX_L(x1, 25, 244.6)},${mapSvgY(76.963)} ` +
    `C ${mapX_L(x1, 25, 244.535)},${mapSvgY(76.877)} ${mapX_L(x1, 25, 244.5)},${mapSvgY(76.771)} ${mapX_L(x1, 25, 244.5)},${mapSvgY(76.663)} ` +
    `L ${mapX_L(x1, 25, 244.5)},${mapSvgY(-0.037)} ` +
    `L ${mapX_L(x1, 25, 196)},${mapSvgY(-0.037)} ` +
    `C ${mapX_L(x1, 25, 194.409)},${mapSvgY(-0.037)} ${mapX_L(x1, 25, 192.883)},${mapSvgY(0.595)} ${mapX_L(x1, 25, 191.757)},${mapSvgY(1.721)} ` +
    `C ${mapX_L(x1, 25, 190.632)},${mapSvgY(2.846)} ${mapX_L(x1, 25, 190)},${mapSvgY(4.372)} ${mapX_L(x1, 25, 190)},${mapSvgY(5.963)} ` +
    `L ${mapX_L(x1, 25, 190)},${mapSvgY(21.963)} ` +
    `L ${mapX_L(x1, 25, 80)},${mapSvgY(21.963)} ` +
    `L ${mapX_L(x1, 25, 80)},${mapSvgY(5.963)} ` +
    `C ${mapX_L(x1, 25, 80)},${mapSvgY(4.372)} ${mapX_L(x1, 25, 79.368)},${mapSvgY(2.846)} ${mapX_L(x1, 25, 78.243)},${mapSvgY(1.721)} ` +
    `C ${mapX_L(x1, 25, 77.117)},${mapSvgY(0.595)} ${mapX_L(x1, 25, 75.591)},${mapSvgY(-0.037)} ${mapX_L(x1, 25, 74)},${mapSvgY(-0.037)} ` +
    `L ${mapX_L(x1, 25, 25.5)},${mapSvgY(-0.037)} ` +
    `L ${mapX_L(x1, 25, 25.5)},${mapSvgY(76.663)} ` +
    `C ${mapX_L(x1, 25, 25.5)},${mapSvgY(76.771)} ${mapX_L(x1, 25, 25.465)},${mapSvgY(76.877)} ${mapX_L(x1, 25, 25.4)},${mapSvgY(76.963)} ` +
    `C ${mapX_L(x1, 25, 25.306)},${mapSvgY(77.089)} ${mapX_L(x1, 25, 25.157)},${mapSvgY(77.163)} ${mapX_L(x1, 25, 25)},${mapSvgY(77.163)} Z`;

  cutPaths.push(outline);
  cutPaths.push(handle1.slotPath);
  cutPaths.push(roof2.slotPath);
  cutPaths.push(handle3.slotPath);
  cutPaths.push(roof4.slotPath);

  if (handle1.creases) foldLines.push(...handle1.creases);
  if (handle3.creases) foldLines.push(...handle3.creases);

  // WINDOW CUTOUT on Panel 3 - Ditto copy from SVG
  const mapX_win = (svgX) => x3 + (svgX - 355) * svgScale;
  const windowPath = `M ${mapX_win(385)},${mapSvgY(176.963)} ` +
    `L ${mapX_win(545)},${mapSvgY(176.963)} ` +
    `C ${mapX_win(547.122)},${mapSvgY(176.963)} ${mapX_win(549.157)},${mapSvgY(176.12)} ${mapX_win(550.657)},${mapSvgY(174.62)} ` +
    `C ${mapX_win(552.157)},${mapSvgY(173.12)} ${mapX_win(553)},${mapSvgY(171.085)} ${mapX_win(553)},${mapSvgY(168.963)} ` +
    `L ${mapX_win(553)},${mapSvgY(104.963)} ` +
    `C ${mapX_win(553)},${mapSvgY(102.841)} ${mapX_win(552.157)},${mapSvgY(100.807)} ${mapX_win(550.657)},${mapSvgY(99.306)} ` +
    `C ${mapX_win(549.157)},${mapSvgY(97.806)} ${mapX_win(547.122)},${mapSvgY(96.963)} ${mapX_win(545)},${mapSvgY(96.963)} ` +
    `L ${mapX_win(385)},${mapSvgY(96.963)} ` +
    `C ${mapX_win(382.878)},${mapSvgY(96.963)} ${mapX_win(380.843)},${mapSvgY(97.806)} ${mapX_win(379.343)},${mapSvgY(99.306)} ` +
    `C ${mapX_win(377.843)},${mapSvgY(100.807)} ${mapX_win(377)},${mapSvgY(102.841)} ${mapX_win(377)},${mapSvgY(104.963)} ` +
    `L ${mapX_win(377)},${mapSvgY(168.963)} ` +
    `C ${mapX_win(377)},${mapSvgY(171.085)} ${mapX_win(377.843)},${mapSvgY(173.12)} ${mapX_win(379.343)},${mapSvgY(174.62)} ` +
    `C ${mapX_win(380.843)},${mapSvgY(176.12)} ${mapX_win(382.878)},${mapSvgY(176.963)} ${mapX_win(385)},${mapSvgY(176.963)} Z`;

  cutPaths.push(windowPath);

  if (windowDecals && windowDecals.length > 0) {
    windowDecals.forEach((windowDecal) => {
      const cx = windowDecal.x;
      const cy = windowDecal.y;
      const w = windowDecal.width;
      const h = windowDecal.height;
      
      let path = "";
      if (windowDecal.shapeType === "circle") {
        const r = Math.min(w, h) / 2;
        path = `M ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy}`;
      } else if (windowDecal.shapeType === "triangle") {
        path = `M ${cx},${cy - h/2} L ${cx + w/2},${cy + h/2} L ${cx - w/2},${cy + h/2} Z`;
      } else if (windowDecal.shapeType === "star") {
        const outerR = Math.min(w, h) / 2;
        const innerR = outerR * 0.382;
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          const ptX = cx + radius * Math.cos(angle);
          const ptY = cy + radius * Math.sin(angle);
          if (i === 0) path += `M ${ptX},${ptY} `;
          else path += `L ${ptX},${ptY} `;
        }
        path += "Z";
      } else if (windowDecal.shapeType === "heart") {
        const size = Math.min(w, h) / 2;
        path = `M ${cx},${cy - size * 0.2} C ${cx + size*0.5},${cy - size*0.8} ${cx + size},${cy - size*0.5} ${cx + size},${cy} C ${cx + size},${cy + size*1.5} ${cx},${cy + size*1.5} ${cx},${cy + size*1.5} C ${cx},${cy + size*1.5} ${cx - size},${cy + size*1.5} ${cx - size},${cy} C ${cx - size},${cy - size*0.5} ${cx - size*0.5},${cy - size*0.8} ${cx},${cy - size * 0.2} Z`;
      } else {
        path = `M ${cx - w/2},${cy - h/2} L ${cx + w/2},${cy - h/2} L ${cx + w/2},${cy + h/2} L ${cx - w/2},${cy + h/2} Z`;
      }
      cutPaths.push(path);
    });
  }

  // CREASES
  foldLines.push({ x1: x1, y1: yTop, x2: x1, y2: yBot });
  foldLines.push({ x1: x2, y1: yTop, x2: x2, y2: yBot });
  foldLines.push({ x1: x3, y1: yTop, x2: x3, y2: yBot });
  foldLines.push({ x1: x4, y1: yTop, x2: x4, y2: yBot });

  foldLines.push({ x1: x1, y1: yTop, x2: x5, y2: yTop });
  foldLines.push({ x1: x1, y1: yBot, x2: x5, y2: yBot });

  // Roof vertical creases
  foldLines.push({ x1: x2 + nW / 2, y1: roof2.slotBottomY, x2: x2 + nW / 2, y2: yTop });
  foldLines.push({ x1: x4 + nW / 2, y1: roof4.slotBottomY, x2: x4 + nW / 2, y2: yTop });

  const dims = { L: nL, W: nW, H: nH, x1, x2, x3, x4, x5, yTop, yBot };

  return {
    width: canvasWidth,
    height: canvasHeight,
    cutPaths,
    foldLines,
    bleedPaths: [],
    dimensions: dims,
    units: "in"
  };
}

