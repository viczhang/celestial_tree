import * as THREE from 'three';

const PARTICLE_COUNT = 15000; // Optimized count for performance/visual balance
// Reduced analysis canvas size for significantly faster loading
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 256;

const COLORS = {
  GREEN: new THREE.Color('#00ff44'), // Brighter neon green
  DARK_GREEN: new THREE.Color('#008822'), // Depth
  RED: new THREE.Color('#ff0033'),
  GOLD: new THREE.Color('#ffdd00'),
  WHITE: new THREE.Color('#ffffff'),
  BLUE: new THREE.Color('#00ccff')
};

interface Point {
  x: number;
  y: number;
}

/**
 * Samples text from a canvas to create a point cloud distribution.
 * Optimized: Uses smaller canvas and strided sampling.
 */
const sampleTextPoints = (text: string, textSize: number): Point[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) return [];

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Text
  ctx.fillStyle = 'white';
  // Scale font size relative to our smaller canvas
  const scaledTextSize = textSize * 0.5; 
  ctx.font = `900 ${scaledTextSize}px "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = text.split('\n');
  const lineHeight = scaledTextSize * 1.1;
  const startY = CANVAS_HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line.toUpperCase(), CANVAS_WIDTH / 2, startY + (index * lineHeight));
  });
  
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;
  const validPixels: Point[] = [];
  
  // Sample pixels - Stride of 2 is sufficient for this resolution
  for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
      for (let x = 0; x < CANVAS_WIDTH; x += 2) {
          const i = (y * CANVAS_WIDTH + x) * 4;
          // Check red channel for brightness
          if (data[i] > 100) {
              validPixels.push({x, y});
          }
      }
  }
  
  return validPixels;
};

export const generateParticles = (text: string = "MERRY\nCHRISTMAS", textSize: number = 120) => {
  const treeData = new Float32Array(PARTICLE_COUNT * 3);
  const galaxyData = new Float32Array(PARTICLE_COUNT * 3);
  const textData = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  const validPixels = sampleTextPoints(text, textSize);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    // --- 1. Tree Shape (Optimized Conical Spiral) ---
    // y goes from -4 (base) to 3.5 (top)
    const y = (Math.random() * 7.5) - 4.0; 
    
    // Radius calculation: wider at bottom, sharp point at top
    // Using power function for a slight curve in the cone
    const normH = (y + 4.0) / 7.5; // 0 to 1
    const radiusAtHeight = (1.0 - normH) * 2.8; 
    
    // Spiral logic
    const spiralTurns = 8;
    const angle = (y * spiralTurns) + (Math.random() * Math.PI * 2);
    
    // Volume filling (not just hollow shell)
    const r = Math.random() < 0.8 
        ? radiusAtHeight * (0.8 + Math.random() * 0.2) // Surface
        : radiusAtHeight * Math.random(); // Internal volume
    
    treeData[i3] = Math.cos(angle) * r;
    treeData[i3 + 1] = y;
    treeData[i3 + 2] = Math.sin(angle) * r;

    // --- 2. Galaxy Shape ---
    const galaxyAngle = Math.random() * Math.PI * 2;
    const galaxyR = Math.random() * 10;
    // Spiral Galaxy Math
    const spiralArmOffset = 3; // number of arms
    const armAngle = (i % spiralArmOffset) * ((Math.PI * 2) / spiralArmOffset);
    const dist = Math.pow(Math.random(), 2) * 8; // Concentrated center
    const theta = armAngle + dist * 0.5;

    galaxyData[i3] = Math.cos(theta) * dist + (Math.random() - 0.5);
    galaxyData[i3 + 1] = (Math.random() - 0.5) * (3 / (dist + 0.1)); // Flatter at edges
    galaxyData[i3 + 2] = Math.sin(theta) * dist + (Math.random() - 0.5);

    // --- 3. Text Shape ---
    if (validPixels.length > 0) {
        const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
        const scale = 0.035; // Adjusted for smaller canvas
        textData[i3] = (pixel.x - CANVAS_WIDTH / 2) * scale;
        textData[i3 + 1] = -(pixel.y - CANVAS_HEIGHT / 2) * scale;
        textData[i3 + 2] = (Math.random() - 0.5) * 0.5; // Flat text
    } else {
        textData[i3] = (Math.random() - 0.5) * 5;
        textData[i3 + 1] = (Math.random() - 0.5) * 5;
        textData[i3 + 2] = (Math.random() - 0.5) * 5;
    }

    // --- 4. Colors ---
    const c = new THREE.Color();
    const randCol = Math.random();
    
    if (randCol > 0.92) c.copy(COLORS.WHITE);     // Sparkles
    else if (randCol > 0.80) c.copy(COLORS.GOLD); // Ornaments
    else if (randCol > 0.70) c.copy(COLORS.RED);  // Ornaments
    else if (randCol > 0.65) c.copy(COLORS.BLUE); // Rare ornaments
    else if (randCol > 0.3) c.copy(COLORS.GREEN); // Tree foliage
    else c.copy(COLORS.DARK_GREEN);               // Deep foliage
    
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  return { treeData, galaxyData, textData, colors };
};