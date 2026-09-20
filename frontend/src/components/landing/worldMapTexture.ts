import * as THREE from 'three';

// Generates a high-resolution, sophisticated scientific Earth texture with
// deep navy/indigo oceans, recognizable continent contours, elegant coordinate grid,
// and subtle illuminated research hubs.
export function createScientificEarthTexture(isDark: boolean = false): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Helper to convert lat/lon to canvas coordinates
  const toXY = (lat: number, lon: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // 1. Deep Navy/Indigo Oceanic Depth
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isDark) {
    oceanGrad.addColorStop(0, '#040814');
    oceanGrad.addColorStop(0.25, '#071326');
    oceanGrad.addColorStop(0.5, '#0A1A36');
    oceanGrad.addColorStop(0.75, '#071326');
    oceanGrad.addColorStop(1, '#040814');
  } else {
    oceanGrad.addColorStop(0, '#0B1E2E');
    oceanGrad.addColorStop(0.3, '#102A3C');
    oceanGrad.addColorStop(0.7, '#15364D');
    oceanGrad.addColorStop(1, '#0B1E2E');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Latitude and Longitude Scientific Graticules (Very subtle, elegant)
  ctx.lineWidth = 1;
  ctx.strokeStyle = isDark ? 'rgba(45, 212, 191, 0.05)' : 'rgba(181, 216, 220, 0.08)';

  // Parallels (every 15 degrees)
  for (let lat = -75; lat <= 75; lat += 15) {
    const [, y] = toXY(lat, 0);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Meridians (every 15 degrees)
  ctx.lineWidth = 1;
  ctx.strokeStyle = isDark ? 'rgba(45, 212, 191, 0.05)' : 'rgba(181, 216, 220, 0.08)';
  for (let lon = -180; lon <= 180; lon += 15) {
    const [x] = toXY(0, lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 3. Continental Landmass Silhouettes (Muted scientific slate-teal)
  const continentColor = isDark ? '#0D222C' : '#1A424E';
  const continentBorder = isDark ? '#1C5C68' : '#328694';

  ctx.fillStyle = continentColor;
  ctx.strokeStyle = continentBorder;
  ctx.lineWidth = 1.4;

  const drawPolygon = (points: [number, number][], fill: boolean = true) => {
    if (points.length < 2) return;
    ctx.beginPath();
    const [startX, startY] = toXY(points[0][0], points[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = toXY(points[i][0], points[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fill) ctx.fill();
    ctx.stroke();
  };

  // North America
  drawPolygon([
    [70, -160], [72, -130], [68, -100], [60, -75], [50, -60],
    [45, -65], [42, -70], [30, -80], [25, -80], [20, -87],
    [16, -92], [14, -90], [10, -84], [8, -78], [15, -92],
    [20, -105], [26, -112], [32, -117], [38, -123], [48, -125],
    [54, -130], [60, -140], [65, -165], [68, -166]
  ]);

  // Greenland
  drawPolygon([
    [82, -40], [80, -20], [75, -20], [70, -25], [60, -45],
    [65, -52], [75, -58], [82, -50]
  ]);

  // South America
  drawPolygon([
    [12, -72], [10, -62], [5, -52], [0, -50], [-5, -35],
    [-10, -36], [-22, -40], [-30, -50], [-40, -62], [-54, -68],
    [-52, -75], [-40, -74], [-30, -72], [-18, -70], [-5, -80],
    [5, -78], [10, -75]
  ]);

  // Europe
  drawPolygon([
    [70, 28], [60, 30], [55, 20], [52, 5], [46, -1],
    [43, -9], [37, -9], [36, -5], [37, 2], [42, 3],
    [44, 8], [40, 15], [38, 24], [40, 28], [45, 30],
    [50, 40], [60, 45], [68, 40]
  ]);

  // British Isles
  drawPolygon([
    [58, -5], [58, -2], [52, 1], [50, -5], [54, -6]
  ]);
  drawPolygon([
    [55, -8], [52, -6], [52, -10], [55, -10]
  ]);

  // Scandinavia
  drawPolygon([
    [71, 26], [70, 18], [63, 10], [58, 6], [56, 12],
    [60, 18], [65, 24], [70, 28]
  ]);

  // Africa
  drawPolygon([
    [36, 10], [35, -5], [30, -10], [20, -17], [10, -15],
    [5, 0], [4, 9], [-5, 12], [-15, 12], [-25, 15],
    [-34, 18], [-34, 26], [-28, 32], [-15, 40], [0, 42],
    [10, 50], [12, 44], [22, 38], [30, 32], [32, 24]
  ]);

  // Madagascar
  drawPolygon([
    [-12, 49], [-16, 50], [-25, 47], [-25, 43], [-16, 44]
  ]);

  // Asia (Eurasia & Middle East)
  drawPolygon([
    [75, 40], [72, 80], [75, 130], [70, 170], [65, 170],
    [60, 160], [55, 140], [45, 140], [40, 130], [35, 120],
    [25, 120], [22, 108], [15, 108], [10, 105], [5, 100],
    [10, 98], [22, 90], [22, 88], [25, 80], [28, 70],
    [24, 60], [12, 45], [15, 40], [30, 34], [35, 36],
    [40, 50], [45, 55], [50, 60], [60, 55], [68, 50]
  ]);

  // India
  drawPolygon([
    [25, 70], [28, 78], [24, 88], [15, 80], [8, 77],
    [15, 73], [22, 69]
  ]);

  // Japan
  drawPolygon([
    [45, 142], [42, 141], [35, 135], [32, 130], [34, 132],
    [40, 140]
  ]);

  // Southeast Asia & Indonesia
  drawPolygon([
    [20, 100], [15, 102], [5, 100], [1, 104], [6, 108],
    [15, 108]
  ]);
  drawPolygon([
    [-2, 100], [-6, 106], [-8, 114], [-7, 115], [-2, 105]
  ]);
  drawPolygon([
    [-1, 118], [-4, 120], [-4, 124], [-1, 124]
  ]);
  drawPolygon([
    [-3, 135], [-7, 141], [-8, 148], [-4, 144], [-2, 138]
  ]);

  // Australia & New Zealand
  drawPolygon([
    [-12, 132], [-14, 136], [-20, 148], [-28, 153], [-37, 150],
    [-38, 144], [-35, 138], [-33, 125], [-34, 115], [-25, 113],
    [-20, 118], [-15, 124]
  ]);
  drawPolygon([
    [-35, 174], [-40, 176], [-46, 168], [-42, 172]
  ]);

  // Antarctica
  drawPolygon([
    [-65, -60], [-70, 0], [-68, 60], [-65, 120], [-68, 180],
    [-75, 120], [-80, 0], [-75, -120], [-65, -60]
  ]);

  // 4. Subtle Telemetry Research Nodes (Major Global Research Hubs)
  const researchHubs: [number, number, string][] = [
    [51.5, -0.12, 'London'],
    [40.7, -74.0, 'New York'],
    [42.3, -71.0, 'Boston'],
    [37.7, -122.4, 'San Francisco'],
    [47.3, 8.5, 'Zurich'],
    [59.3, 18.0, 'Stockholm'],
    [35.6, 139.6, 'Tokyo'],
    [28.6, 77.2, 'New Delhi'],
    [1.35, 103.8, 'Singapore'],
    [-37.8, 144.9, 'Melbourne'],
  ];

  // Interconnecting faint research arcs
  ctx.strokeStyle = isDark ? 'rgba(45, 212, 191, 0.15)' : 'rgba(27, 107, 117, 0.18)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);

  const hubPairs = [
    [0, 2], // London to Boston
    [2, 3], // Boston to San Francisco
    [0, 4], // London to Zurich
    [4, 6], // Zurich to Tokyo
    [6, 8], // Tokyo to Singapore
  ];

  hubPairs.forEach(([i, j]) => {
    const [x1, y1] = toXY(researchHubs[i][0], researchHubs[i][1]);
    const [x2, y2] = toXY(researchHubs[j][0], researchHubs[j][1]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 25; // Subtle curve upward
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Draw node points
  researchHubs.forEach(([lat, lon]) => {
    const [nx, ny] = toXY(lat, lon);

    // Faint outer pulse ring
    ctx.strokeStyle = isDark ? 'rgba(45, 212, 191, 0.45)' : 'rgba(27, 107, 117, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(nx, ny, 5.5, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glowing core
    ctx.fillStyle = isDark ? '#5EEAD4' : '#14B8A6';
    ctx.beginPath();
    ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
