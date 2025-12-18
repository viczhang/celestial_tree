import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float, Center } from '@react-three/drei';
import * as THREE from 'three';
import { VisualMode } from '../types';

interface TopStarProps {
  mode: VisualMode;
}

const TopStar: React.FC<TopStarProps> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const { starShape, extrudeSettings } = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.45;
    const innerRadius = 0.2;
    const points = 5;

    shape.moveTo(0, outerRadius);

    for (let i = 1; i <= points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      shape.lineTo(Math.sin(angle) * radius, Math.cos(angle) * radius);
    }
    shape.closePath();

    const settings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.02,
      bevelSegments: 3
    };

    return { starShape: shape, extrudeSettings: settings };
  }, []);

  useLayoutEffect(() => {
    // Set initial position without binding it to props, allowing useFrame to control it freely
    if (groupRef.current) {
      groupRef.current.position.set(0, 4.2, 0);
    }
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;
    
    const isTree = mode === VisualMode.TREE;
    
    // Target state
    const targetScale = isTree ? 1 : 0;
    // When disappearing, move up and back into the distance
    const targetPos = isTree 
      ? new THREE.Vector3(0, 4.2, 0) 
      : new THREE.Vector3(0, 20, -30);
    
    // Smooth transition speeds
    // Slower move/fade when disappearing for "graceful" effect
    const moveSpeed = isTree ? 3.0 : 0.5;
    const scaleSpeed = isTree ? 3.0 : 0.8;

    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), scaleSpeed * delta);
    groupRef.current.position.lerp(targetPos, moveSpeed * delta);

    if (lightRef.current) {
        lightRef.current.intensity = THREE.MathUtils.lerp(
          lightRef.current.intensity, 
          isTree ? 2 : 0, 
          scaleSpeed * delta
        );
    }

    if (!isTree && groupRef.current.scale.x < 0.01) {
        groupRef.current.visible = false;
    } else {
        groupRef.current.visible = true;
    }

    meshRef.current.rotation.y += 0.02;
    
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 3) * 0.1;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}> 
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[0, 0.2]}>
        <Center>
          <mesh ref={meshRef}>
              <extrudeGeometry args={[starShape, extrudeSettings]} />
              <meshStandardMaterial 
                  color="#ffeb3b" 
                  emissive="#ffdb4d"
                  emissiveIntensity={4}
                  toneMapped={false}
                  roughness={0.1}
                  metalness={0.8}
              />
          </mesh>
        </Center>
        <pointLight ref={lightRef} color="#ffdb4d" intensity={2} distance={6} decay={2} />
        <Sparkles 
            count={40} 
            scale={2.5} 
            size={8} 
            speed={0.4} 
            opacity={1} 
            color="#fff" 
        />
      </Float>
    </group>
  );
};

export default TopStar;