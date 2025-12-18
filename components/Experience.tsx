import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import MagicParticles from './MagicParticles';
import TopStar from './TopStar';
import TextSparkles from './TextSparkles';
import { VisualMode } from '../types';

interface ExperienceProps {
  mode: VisualMode;
  rotation: number;
  text: string;
  textSize: number;
}

const CameraHandler: React.FC<{ mode: VisualMode }> = ({ mode }) => {
  useFrame((state) => {
    const targetPos = new THREE.Vector3();
    
    if (mode === VisualMode.GALAXY) {
      // 45 degreeish view: Elevated Y, distant Z (e.g., [0, 8, 12])
      targetPos.set(0, 8, 12);
    } else {
      // Front view for Tree and Text
      targetPos.set(0, 0, 14);
    }

    // Smoothly interpolate camera position
    // We use a small lerp factor for a slow, cinematic drift
    const step = 0.02;
    state.camera.position.lerp(targetPos, step);
    
    // If OrbitControls are active (makeDefault), we need to update them
    // to reflect the manual camera position change, otherwise they might snap back.
    if (state.controls) {
      // @ts-ignore - OrbitControls type definition might be missing update in strict contexts
      state.controls.update();
    } else {
      state.camera.lookAt(0, 0, 0);
    }
  });
  return null;
};

const Experience: React.FC<ExperienceProps> = ({ mode, rotation, text, textSize }) => {
  return (
    <div className="fixed inset-0 bg-black">
      <Canvas 
        camera={{ position: [0, 0, 14], fov: 45 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ReinhardToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        <color attach="background" args={['#020202']} />
        
        <ambientLight intensity={0.5} />
        
        <CameraHandler mode={mode} />

        <Suspense fallback={null}>
          <MagicParticles mode={mode} rotationStrength={rotation} text={text} textSize={textSize} />
          <TopStar mode={mode} />
          <TextSparkles mode={mode} />
        </Suspense>

        <EffectComposer disableNormalPass>
          <Bloom 
            intensity={1.5} 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            mipmapBlur 
          />
        </EffectComposer>

        <OrbitControls 
          makeDefault
          enableZoom={true} 
          enablePan={false} 
          maxDistance={30} 
          minDistance={2} 
        />
      </Canvas>
    </div>
  );
};

export default Experience;