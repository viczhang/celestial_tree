import React, { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
      targetPos.set(0, 10, 15);
    } else if (mode === VisualMode.TREE) {
      targetPos.set(0, 1, 14); // Look slightly up at the tree
    } else {
      targetPos.set(0, 0, 14);
    }

    state.camera.position.lerp(targetPos, 0.02);
    
    if (state.controls) {
      // @ts-ignore
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
        dpr={[1, 2]} // Handle high-dpi screens
        camera={{ position: [0, 0, 14], fov: 45 }}
        gl={{ 
          antialias: false, // Rely on post-processing or high DPR
          toneMapping: THREE.ReinhardToneMapping,
          toneMappingExposure: 1.5,
          powerPreference: "high-performance"
        }}
      >
        <color attach="background" args={['#050505']} />
        
        <CameraHandler mode={mode} />

        <Suspense fallback={null}>
          <MagicParticles mode={mode} rotationStrength={rotation} text={text} textSize={textSize} />
          <TopStar mode={mode} />
          <TextSparkles mode={mode} />
        </Suspense>

        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom 
            intensity={2.0} 
            luminanceThreshold={0.4} 
            luminanceSmoothing={0.9} 
            mipmapBlur 
            radius={0.6}
          />
        </EffectComposer>

        <OrbitControls 
          makeDefault
          enableZoom={true} 
          enablePan={false} 
          maxDistance={40} 
          minDistance={2} 
        />
      </Canvas>
    </div>
  );
};

export default Experience;