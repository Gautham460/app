import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Sphere, 
  MeshTransmissionMaterial, 
  Float, 
  Environment, 
  ContactShadows, 
  OrbitControls, 
  Text,
  Sparkles
} from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';

function MoodOrb({ speed = 1, color = '#a78bfa', intensity = 1, position = [0, 0, 0], mood = "" }) {
  const mesh = useRef();
  
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    // Complex industry-level orbital movement
    mesh.current.position.y = position[1] + Math.sin(t * speed * 0.5 + position[0]) * 0.4;
    mesh.current.position.x = position[0] + Math.cos(t * speed * 0.3 + position[1]) * 0.2;
    mesh.current.rotation.x = t * 0.2 * speed;
    mesh.current.rotation.y = t * 0.3 * speed;
  });

  // Calculate size based on intensity/log count
  const radius = 0.6 + (Math.min(intensity, 10) * 0.15);

  return (
    <Float speed={speed * 1.5} rotationIntensity={1} floatIntensity={1}>
      <Sphere ref={mesh} args={[radius, 64, 64]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.5}
        />
        <Sparkles count={Math.min(intensity * 10, 100)} scale={radius * 2} size={2} speed={speed} color={color} />
      </Sphere>
      <Text
        position={[0, -radius - 0.4, 0]}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {mood.toUpperCase()}
      </Text>
    </Float>
  );
}

export default function ThreeMoodSphere({ speed = 1, clusters = {} }) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 5] }}
      style={{ background: '#000', height: '100%', width: '100%' }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Canvas>
  );
}
