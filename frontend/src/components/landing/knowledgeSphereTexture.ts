import * as THREE from 'three';

// Research vocabulary dictionary categorized into tiers
const TIER_1_KEYWORDS = [
  'LITERATURE',
  'EVIDENCE',
  'METHODS',
  'DATASETS',
  'FINDINGS',
  'VALIDATION',
  'THEORY',
  'MODELS',
];

const TIER_2_KEYWORDS = [
  'ALGORITHMS',
  'EXPERIMENTS',
  'HYPOTHESIS',
  'REPRODUCIBILITY',
  'GENERALIZATION',
  'STATISTICS',
  'TAXONOMY',
  'SYNTHESIS',
  'CITATIONS',
  'LIMITATIONS',
  'NOVELTY',
  'BENCHMARKS',
  'FRAMEWORKS',
  'EVALUATION',
  'VARIABLES',
  'DISCOVERY',
  'PARADIGMS',
  'INFERENCE',
];

const TIER_3_KEYWORDS = [
  'CASE STUDIES',
  'EMPIRICAL',
  'QUALITATIVE',
  'QUANTITATIVE',
  'INTERPRETATION',
  'DISCUSSION',
  'ABLATION STUDY',
  'CLINICAL TRIALS',
  'CORPUS',
  'APPROACH',
  'CHALLENGES',
  'IMPLICATIONS',
  'PEER REVIEW',
  'KNOWLEDGE',
  'FUTURE WORK',
  'BEHAVIORS',
  'LONGITUDINAL',
  'PREDICTION',
  'SURVEYS',
  'ARCHITECTURE',
  'SAMPLING',
  'METHODOLOGY',
  'RESEARCH QUESTIONS',
  'AXIOMS',
  'REPLICATION',
  'THEORIES',
  'PUBLICATIONS',
  'METRICS',
  'CONTEXT',
  'COHORTS',
  'PARAMETERS',
  'ASSUMPTIONS',
  'FORMULATION',
  'REASONING',
  'ONTOLOGY',
  'CONTRIBUTIONS',
  'INTERDISCIPLINARY',
  'SYSTEMATICS',
  'ANOMALIES',
  'BENCHMARKING',
  'HEURISTICS',
  'CORROBORATION',
  'CAUSALITY',
  'SIMULATIONS',
  'META-ANALYSIS',
];



export interface KnowledgeSphereTextures {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

// Generates high-DPI equirectangular textures constructing the spherical knowledge field
export function createKnowledgeSphereTextures(isDark: boolean = true): KnowledgeSphereTextures {
  const width = 4096;
  const height = 2048;

  // 1. Color Canvas
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cctx = colorCanvas.getContext('2d')!;

  // 2. Bump Canvas (for physical 3D text relief)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bctx = bumpCanvas.getContext('2d')!;

  // 3. Emissive Canvas (for illuminating the gap perimeter)
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;
  const ectx = emissiveCanvas.getContext('2d')!;

  // Convert (lon, lat) to canvas (x, y)
  const toXY = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // Base Deep Navy / Black Knowledge Void
  const bgGrad = cctx.createLinearGradient(0, 0, 0, height);
  if (isDark) {
    bgGrad.addColorStop(0, '#02050E');
    bgGrad.addColorStop(0.25, '#040B1A');
    bgGrad.addColorStop(0.5, '#061126');
    bgGrad.addColorStop(0.75, '#040B1A');
    bgGrad.addColorStop(1, '#02050E');
  } else {
    bgGrad.addColorStop(0, '#0A1728');
    bgGrad.addColorStop(0.5, '#0F243C');
    bgGrad.addColorStop(1, '#0A1728');
  }
  cctx.fillStyle = bgGrad;
  cctx.fillRect(0, 0, width, height);

  // Bump & Emissive base: neutral flat black
  bctx.fillStyle = '#000000';
  bctx.fillRect(0, 0, width, height);
  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, width, height);

  // Subtle Scientific Graticule Field (Fine Coordinate Cage)
  cctx.lineWidth = 1;
  cctx.strokeStyle = isDark ? 'rgba(45, 212, 191, 0.04)' : 'rgba(13, 148, 136, 0.06)';
  for (let lat = -80; lat <= 80; lat += 20) {
    const [, y] = toXY(0, lat);
    cctx.beginPath();
    cctx.moveTo(0, y);
    cctx.lineTo(width, y);
    cctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 20) {
    const [x] = toXY(lon, 0);
    cctx.beginPath();
    cctx.moveTo(x, 0);
    cctx.lineTo(x, height);
    cctx.stroke();
  }

  // Helper to draw a single word on the sphere surface
  const drawWord = (
    text: string,
    lon: number,
    lat: number,
    fontSize: number,
    weight: string,
    color: string,
    bumpAlpha: number,
    letterSpacing: number = 2
  ) => {
    const [x, y] = toXY(lon, lat);
    const fontStr = `${weight} ${fontSize}px "Inter", -apple-system, sans-serif`;

    // A. Color Pass
    cctx.font = fontStr;
    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    cctx.fillStyle = color;

    // Manual letter spacing for crisp canvas rendering
    const chars = Array.from(text);
    let totalW = 0;
    const widths = chars.map((ch) => {
      const w = cctx.measureText(ch).width;
      totalW += w + letterSpacing;
      return w;
    });
    totalW -= letterSpacing;

    let curX = x - totalW / 2;
    for (let i = 0; i < chars.length; i++) {
      cctx.fillText(chars[i], curX, y);
      curX += widths[i] + letterSpacing;
    }

    // B. Bump Pass (high-contrast white text for 3D tactile relief)
    bctx.font = fontStr;
    bctx.textAlign = 'center';
    bctx.textBaseline = 'middle';
    bctx.fillStyle = `rgba(255, 255, 255, ${bumpAlpha})`;

    curX = x - totalW / 2;
    for (let i = 0; i < chars.length; i++) {
      bctx.fillText(chars[i], curX, y);
      curX += widths[i] + letterSpacing;
    }
  };

  // -------------------------------------------------------------
  // DENSE TYPOGRAPHIC DISTRIBUTION ACROSS THE SPHERE
  // -------------------------------------------------------------

  // Seeded pseudo-random generator for consistent deterministic placement
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // 1. TIER 3: Micro Research Density (Dense literature substrate)
  for (let lat = -75; lat <= 75; lat += 3.8) {
    // Cosine scaling for spherical packing density
    const stepLon = 4.8 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    for (let lon = -180; lon < 180; lon += stepLon) {
      const jitterLon = lon + (rand() - 0.5) * (stepLon * 0.7);
      const jitterLat = lat + (rand() - 0.5) * 2.8;

      const word = TIER_3_KEYWORDS[Math.floor(rand() * TIER_3_KEYWORDS.length)];
      const opacity = 0.22 + rand() * 0.28;
      const gray = Math.floor(160 + rand() * 55);
      const color = isDark
        ? `rgba(${gray}, ${gray + 15}, ${gray + 25}, ${opacity})`
        : `rgba(40, 60, 85, ${opacity * 0.9})`;

      const size = Math.floor(13 + rand() * 7);
      drawWord(word, jitterLon, jitterLat, size, '500', color, opacity * 0.35, 1.5);
    }
  }

  // 2. TIER 2: Major Domain Clusters (Medium scale concepts)
  const tier2Positions: Array<[number, number]> = [
    // Surrounding established research clusters
    [-140, 45], [-120, 20], [-90, 55], [-70, -25], [-50, 35],
    [-20, 60], [-10, -45], [0, 40], [20, -35], [50, 45],
    [70, 15], [90, 50], [110, -20], [130, 40], [150, -50],
    [-110, -55], [-35, -15], [75, -60], [100, -40], [160, 25],
    // Near gap perimeter
    [10, 28], [58, 26], [62, -10], [12, -12], [32, 28], [34, -14],
  ];

  tier2Positions.forEach(([lon, lat], i) => {
    const word = TIER_2_KEYWORDS[i % TIER_2_KEYWORDS.length];
    const opacity = 0.65 + rand() * 0.25;
    const isCyanAccent = i % 4 === 0;
    const color = isCyanAccent
      ? isDark ? `rgba(94, 234, 212, ${opacity})` : `rgba(13, 148, 136, ${opacity})`
      : isDark ? `rgba(241, 245, 249, ${opacity})` : `rgba(20, 35, 55, ${opacity})`;

    const size = Math.floor(26 + rand() * 10);
    drawWord(word, lon, lat, size, '700', color, 0.70, 3);
  });

  // 3. TIER 1: Commanding Academic Anchors (Hero keywords)
  const tier1Positions: Array<{ word: string; lon: number; lat: number; size: number }> = [
    { word: 'LITERATURE', lon: -15, lat: 34, size: 58 },
    { word: 'EVIDENCE', lon: -6, lat: 20, size: 54 },
    { word: 'METHODS', lon: -12, lat: 4, size: 52 },
    { word: 'DATASETS', lon: -16, lat: -12, size: 50 },
    { word: 'FINDINGS', lon: -10, lat: -26, size: 48 },
    { word: 'VALIDATION', lon: -14, lat: -40, size: 46 },
    { word: 'THEORY', lon: -100, lat: 30, size: 54 },
    { word: 'MODELS', lon: 95, lat: 25, size: 52 },
  ];

  tier1Positions.forEach((item) => {
    // Sharp, commanding warm-white / pale gray text with maximum relief
    const color = isDark ? '#FFFFFF' : '#0F172A';
    drawWord(item.word, item.lon, item.lat, item.size, '800', color, 1.0, 4);
  });



  // Create Three.js Canvas Textures
  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.minFilter = THREE.LinearMipmapLinearFilter;
  colorMap.magFilter = THREE.LinearFilter;
  colorMap.generateMipmaps = true;
  colorMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.minFilter = THREE.LinearFilter;
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.generateMipmaps = false;
  bumpMap.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.minFilter = THREE.LinearFilter;
  emissiveMap.magFilter = THREE.LinearFilter;
  emissiveMap.generateMipmaps = false;
  emissiveMap.needsUpdate = true;

  return { colorMap, bumpMap, emissiveMap };
}
