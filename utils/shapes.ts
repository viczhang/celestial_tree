import * as THREE from 'three';

const PARTICLE_COUNT = 18000; 
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 512;

const COLORS = {
  GREEN: new THREE.Color('#22ff77'),
  RED: new THREE.Color('#ff2244'),
  GOLD: new THREE.Color('#ffcc33'),
  WHITE: new THREE.Color('#ffffff'),
};

interface Point {
  x: number;
  y: number;
}

/**
 * Samples text from a canvas to create a point cloud distribution.
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
  ctx.font = `bold ${textSize}px "Arial", "Times New Roman", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = text.split('\n');
  const lineHeight = textSize * 1.1;
  const startY = CANVAS_HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line.toUpperCase(), CANVAS_WIDTH / 2, startY + (index * lineHeight));
  });
  
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;
  const validPixels: Point[] = [];
  
  // Sample pixels
  for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      for (let x = 0; x < CANVAS_WIDTH; x += 4) {
          const i = (y * CANVAS_WIDTH + x) * 4;
          // Check red channel for brightness
          if (data[i] > 128) {
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

    // --- 1. Tree Shape (Cone Spiral + Scatter) ---
    const y = (Math.random() * 6) - 3.5; 
    const radiusAtHeight = Math.max(0, (2.5 - y) * 0.6); 
    const spiralIntensity = 12;
    const angle = y * spiralIntensity + Math.random() * Math.PI * 2; 
    const scatter = (Math.random() - 0.5) * 0.25; 
    
    treeData[i3] = Math.cos(angle) * (radiusAtHeight + scatter);
    treeData[i3 + 1] = y + 0.5;
    treeData[i3 + 2] = Math.sin(angle) * (radiusAtHeight + scatter);

    // --- 2. Galaxy Shape ---
    const randomR = Math.random();
    const r = Math.pow(randomR, 1.5) * 10.0; 
    const branches = 3;
    const branchIdx = i % branches;
    const branchBaseAngle = (branchIdx / branches) * (Math.PI * 2);
    const spiralAngle = r * 0.8; 
    
    // Increased spread for fuzziness
    const theta = branchBaseAngle + spiralAngle + (Math.random() - 0.5) * 1.5;
    
    // Add noise to positions for "fuzzier" look
    const galaxyNoise = 0.4;

    galaxyData[i3] = Math.cos(theta) * r + (Math.random() - 0.5) * galaxyNoise;
    galaxyData[i3 + 1] = (Math.random() - 0.5) * (2.0 * Math.exp(-r * 0.2)) + (Math.random() - 0.5) * 0.5;
    galaxyData[i3 + 2] = Math.sin(theta) * r + (Math.random() - 0.5) * galaxyNoise;

    // --- 3. Text Shape ---
    if (validPixels.length > 0) {
        const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
        const scale = 0.015; 
        // Increased xy spread significantly
        const spread = 0.25; 
        textData[i3] = (pixel.x - CANVAS_WIDTH / 2) * scale + (Math.random() - 0.5) * spread;
        textData[i3 + 1] = -(pixel.y - CANVAS_HEIGHT / 2) * scale + (Math.random() - 0.5) * spread;
        // Increased z-depth spread significantly
        textData[i3 + 2] = (Math.random() - 0.5) * 1.5; 
    } else {
        // Fallback cloud if no text pixels found
        textData[i3] = (Math.random() - 0.5) * 10;
        textData[i3 + 1] = (Math.random() - 0.5) * 10;
        textData[i3 + 2] = (Math.random() - 0.5) * 10;
    }

    // --- 4. Colors ---
    const c = new THREE.Color();
    const randCol = Math.random();
    
    if (randCol > 0.95) c.copy(COLORS.WHITE);
    else if (randCol > 0.85) c.copy(COLORS.GOLD); 
    else if (randCol > 0.60) c.copy(COLORS.RED); 
    else c.copy(COLORS.GREEN); 
    
    // Shimmer variation
    c.offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.1);

    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  return { treeData, galaxyData, textData, colors };
};