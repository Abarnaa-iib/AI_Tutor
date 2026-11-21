import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";

function Model() {
  const { scene } = useGLTF("/Meshy_AI_Character_output.glb");

  return (
    <primitive
      object={scene}
      scale={1.8}
      position={[0, -1.5, 0]}
    />
  );
}

export default function Avatar() {
  return (
    <Canvas style={{ height: "500px" }}>
      <ambientLight intensity={1} />
      <directionalLight position={[2, 2, 2]} />

      <Model />

      <OrbitControls />
    </Canvas>
  );
}