import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateParticles } from '../utils/shapes';
import { VisualMode } from '../types';

interface MagicParticlesProps {
  mode: VisualMode;
  rotationStrength: number;
  text?: string;
  textSize?: number;
}

interface ParticleData {
  treeData: Float32Array;
  galaxyData: Float32Array;
  textData: Float32Array;
  colors: Float32Array;
}

interface ParticleLayerProps {
  mode: VisualMode;
  rotationStrength: number;
  speedMultiplier: number;
  opacity: number;
  size: number;
  data: ParticleData;
  enableSparkle: boolean;
  texture?: THREE.Texture | null;
}

const ParticleLayer: React.FC<ParticleLayerProps> = ({ 
  mode, 
  rotationStrength, 
  speedMultiplier, 
  opacity, 
  size, 
  data,
  enableSparkle,
  texture
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  
  const initialPositions = useMemo(() => new Float32Array(data.treeData), [data]);
  const initialColors = useMemo(() => new Float32Array(data.colors), [data]);

  // Reset rotation when switching to TEXT mode so it's readable immediately
  useEffect(() => {
    if (mode === VisualMode.TEXT && pointsRef.current) {
      pointsRef.current.rotation.y = 0;
    }
  }, [mode]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !geometryRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Rotation logic
    if (mode === VisualMode.TEXT) {
      // For text, allow full rotation interaction via mouse (no auto-spin)
      const targetRotationY = rotationStrength * 1.5;
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(
        pointsRef.current.rotation.y, 
        targetRotationY, 
        delta * 2.0
      );
    } else {
      // Continuous rotation for Tree and Galaxy
      const targetRotationY = (rotationStrength * 1.5) + (time * 0.05);
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(
        pointsRef.current.rotation.y, 
        targetRotationY, 
        delta * 1.5
      );
    }

    const positions = geometryRef.current.attributes.position.array as Float32Array;
    
    let targetPositions = data.treeData;
    if (mode === VisualMode.GALAXY) targetPositions = data.galaxyData;
    else if (mode === VisualMode.TEXT) targetPositions = data.textData;
    
    const lerpSpeed = 3.0 * speedMultiplier;

    for (let i = 0; i < positions.length; i++) {
      positions[i] = THREE.MathUtils.lerp(positions[i], targetPositions[i], delta * lerpSpeed);
      if (enableSparkle && Math.random() > 0.99) {
          positions[i] += (Math.random() - 0.5) * 0.02;
      }
    }
    geometryRef.current.attributes.position.needsUpdate = true;

    const colors = geometryRef.current.attributes.color.array as Float32Array;
    const baseColors = data.colors;
    
    for (let i = 0; i < colors.length / 3; i++) {
      const i3 = i * 3;
      const phase = i * 0.1;
      let brightness = 1.0;

      if (enableSparkle) {
        const t = time * 3.0 + phase;
        brightness = 0.4 + 0.6 * Math.pow(Math.sin(t), 12);
      } else {
        brightness = 0.5 + 0.2 * Math.sin(time * 1.0 + phase);
      }
      
      colors[i3]     = baseColors[i3] * brightness;
      colors[i3 + 1] = baseColors[i3 + 1] * brightness;
      colors[i3 + 2] = baseColors[i3 + 2] * brightness;
    }
    geometryRef.current.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={initialPositions.length / 3}
          array={initialPositions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          count={initialColors.length / 3}
          array={initialColors}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        map={texture || undefined}
        vertexColors
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};

const MagicParticles: React.FC<MagicParticlesProps> = ({ mode, rotationStrength, text, textSize }) => {
  const data = useMemo(() => generateParticles(text, textSize), [text, textSize]);

  // Generate a soft glow texture for "fuzzy" particles
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Soft radial gradient from white to transparent
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)'); // Use black/transparent for blending
    
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  return (
    <group>
      <ParticleLayer 
        mode={mode} 
        rotationStrength={rotationStrength} 
        speedMultiplier={1.0} 
        opacity={0.8} 
        size={0.15} 
        data={data}
        enableSparkle={true}
        texture={particleTexture}
      />
      <ParticleLayer 
        mode={mode} 
        rotationStrength={rotationStrength} 
        speedMultiplier={0.5} 
        opacity={0.3} 
        size={0.12} 
        data={data}
        enableSparkle={false}
        texture={particleTexture}
      />
    </group>
  );
};

export default MagicParticles;