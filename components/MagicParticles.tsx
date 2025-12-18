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

interface ParticleLayerProps {
  mode: VisualMode;
  rotationStrength: number;
  speedMultiplier: number;
  opacity: number;
  size: number;
  data: any;
  enableSparkle: boolean;
  texture: THREE.Texture;
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

  // Current visible positions buffer
  const currentPositions = useRef(new Float32Array(data.treeData));

  useEffect(() => {
    if (mode === VisualMode.TEXT && pointsRef.current) {
      pointsRef.current.rotation.y = 0;
    }
  }, [mode]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !geometryRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Smooth Rotation logic
    if (mode === VisualMode.TEXT) {
      const targetRotationY = rotationStrength * 1.0;
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(
        pointsRef.current.rotation.y, 
        targetRotationY, 
        delta * 3.0
      );
    } else {
      const targetRotationY = (rotationStrength * 2.0) + (time * 0.1);
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(
        pointsRef.current.rotation.y, 
        targetRotationY, 
        delta * 2.0
      );
    }

    // Determine target state
    let targetArr = data.treeData;
    if (mode === VisualMode.GALAXY) targetArr = data.galaxyData;
    else if (mode === VisualMode.TEXT) targetArr = data.textData;
    
    // Physics / Interpolation
    const positions = geometryRef.current.attributes.position.array as Float32Array;
    const lerpSpeed = 4.0 * speedMultiplier;
    const wobble = 0.02;

    for (let i = 0; i < positions.length; i++) {
      // Interpolate towards target
      currentPositions.current[i] = THREE.MathUtils.lerp(
        currentPositions.current[i], 
        targetArr[i], 
        delta * lerpSpeed
      );
      
      // Apply to geometry with some noise
      if (enableSparkle) {
         positions[i] = currentPositions.current[i] + Math.sin(time * 2 + i) * wobble;
      } else {
         positions[i] = currentPositions.current[i];
      }
    }
    geometryRef.current.attributes.position.needsUpdate = true;

    // Color/Sparkle Animation
    const colors = geometryRef.current.attributes.color.array as Float32Array;
    const baseColors = data.colors;
    
    for (let i = 0; i < colors.length / 3; i++) {
      const i3 = i * 3;
      
      let brightness = 1.0;
      if (enableSparkle) {
        // Twinkle effect
        const speed = 3.0 + (i % 5);
        const val = Math.sin(time * speed + i);
        brightness = 0.5 + 0.9 * Math.pow((val + 1) / 2, 4); // Sharp peaks for sparkles
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
        map={texture}
        vertexColors
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
        alphaTest={0.01}
      />
    </points>
  );
};

const MagicParticles: React.FC<MagicParticlesProps> = ({ mode, rotationStrength, text, textSize }) => {
  const data = useMemo(() => generateParticles(text, textSize), [text, textSize]);

  // Generate a Star/Lens Flare texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();
    
    // Clear
    ctx.clearRect(0, 0, 64, 64);
    
    // Center glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Star spikes (Cross shape)
    ctx.beginPath();
    ctx.moveTo(32, 0); ctx.lineTo(32, 64);
    ctx.moveTo(0, 32); ctx.lineTo(64, 32);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.premultiplyAlpha = true;
    return texture;
  }, []);

  return (
    <group>
      {/* Primary bright layer */}
      <ParticleLayer 
        mode={mode} 
        rotationStrength={rotationStrength} 
        speedMultiplier={1.0} 
        opacity={1.0} 
        size={0.25} 
        data={data}
        enableSparkle={true}
        texture={particleTexture}
      />
      {/* Secondary ambient halo layer */}
      <ParticleLayer 
        mode={mode} 
        rotationStrength={rotationStrength} 
        speedMultiplier={0.8} 
        opacity={0.3} 
        size={0.5} 
        data={data}
        enableSparkle={false}
        texture={particleTexture}
      />
    </group>
  );
};

export default MagicParticles;