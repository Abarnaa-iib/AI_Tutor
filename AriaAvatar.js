import React, { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const MODEL_URL = "/Talking.fbx";

// ─── Inner 3D Model ───────────────────────────────────────────────────────────
function AvatarModel({ speaking, emotion }) {
  const group = useRef();
  const fbx = useLoader(FBXLoader, MODEL_URL);
  const { actions, names, mixer } = useAnimations(fbx.animations, group);
  const scene = fbx;

  // Idle sway parameters
  const clock = useRef(0);
  const basePosY = useRef(null);

  useEffect(() => {
    // Color and setup the model ONCE on load
    fbx.traverse((node) => {
      if (node.isMesh) {
        // Handle multi-materials or single material
        const isMulti = Array.isArray(node.material);
        const materials = isMulti ? node.material : [node.material];
        
        node.material = materials.map((oldMat, idx) => {
          if (!oldMat) return oldMat;
          
          // If the material already has a texture map, KEEP IT
          if (oldMat.map) {
            oldMat.roughness = 0.8;
            oldMat.metalness = 0.1;
            return oldMat;
          }

          // Otherwise, create a new material with part-aware coloring
          const mat = new THREE.MeshStandardMaterial({
            name: oldMat.name,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.FrontSide
          });

          // Identify part by material name, mesh name, or index
          const meshName = node.name.toLowerCase();
          const matName = (oldMat.name || "").toLowerCase();
          const searchStr = (meshName + " " + matName + " " + idx).toLowerCase();
          
          // Color selection based on keywords
          if (searchStr.includes("hair") || searchStr.includes("head") || searchStr.includes("brows") || searchStr.includes("lash")) {
            mat.color.setHex(0x3B2F2F); // Darker brown hair
          } 
          else if (searchStr.includes("skin") || searchStr.includes("face") || searchStr.includes("body") || searchStr.includes("arm") || searchStr.includes("hand") || searchStr.includes("flesh")) {
            mat.color.setHex(0xE6B8A2); // Skin tone
          }
          else if (searchStr.includes("shirt") || searchStr.includes("top") || searchStr.includes("jacket") || searchStr.includes("cloth") || (isMulti && idx === 1)) {
            mat.color.setHex(0x2E5090); // Professional blue shirt
          }
          else if (searchStr.includes("pant") || searchStr.includes("leg") || searchStr.includes("bottom") || searchStr.includes("trousers") || (isMulti && idx === 2)) {
            mat.color.setHex(0x1A1A1A); // Dark charcoal pants
          }
          else if (searchStr.includes("shoe") || searchStr.includes("foot") || searchStr.includes("boot") || (isMulti && idx === 3)) {
            mat.color.setHex(0x2A2A2A); // Black/Grey shoes
          }
          else {
            // Smart fallback: try to guess by index if multi-material
            if (isMulti) {
              const guessColors = [0xE6B8A2, 0x2E5090, 0x1A1A1A, 0x3B2F2F, 0x2A2A2A];
              mat.color.setHex(guessColors[idx % guessColors.length]);
            } else {
              mat.color.setHex(0xE6B8A2); // Fallback to skin
            }
          }

          return mat;
        });

        if (!isMulti) {
          node.material = node.material[0];
        }

        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Play idle animation
    if (fbx.animations && fbx.animations.length > 0 && mixer) {
      const action = mixer.clipAction(fbx.animations[0]);
      action.play();
    }
    
    // WebGL Context error handling
    const gl = group.current?.parent?.parent?.getState?.()?.gl;
    if (gl) {
      const handleLost = (e) => { e.preventDefault(); console.warn("WebGL Context Lost"); };
      const handleRestore = () => { console.log("WebGL Context Restored"); };
      gl.domElement.addEventListener('webglcontextlost', handleLost, false);
      gl.domElement.addEventListener('webglcontextrestored', handleRestore, false);
      return () => {
        gl.domElement.removeEventListener('webglcontextlost', handleLost);
        gl.domElement.removeEventListener('webglcontextrestored', handleRestore);
      };
    }
  }, [fbx, mixer]);

  // Animation and Lip Sync
  useFrame((state, delta) => {
    if (!group.current) return;
    clock.current += delta;

    // Word-like lip movement simulator
    const wave1 = Math.sin(clock.current * 4.0);
    const wave2 = Math.sin(clock.current * 2.5);
    let lipMovement = speaking ? (wave1 + wave2) * 0.5 * 0.4 + 0.2 : 0;
    
    // Teaching phase cycle (10 seconds total) for varied realistic gestures
    const cycle = clock.current % 10;
    let gesturePhase = 0;
    if (cycle < 2.5) gesturePhase = 0; // Calm explaining with hands in front
    else if (cycle < 5) gesturePhase = 1; // Emphasizing with one hand
    else if (cycle < 7.5) gesturePhase = 2; // Side-to-side presenting
    else gesturePhase = 3; // Thinking pose with hand gesture

    // Body sway - subtle natural movement
    if (group.current) {
      group.current.position.y = -1.0 + Math.sin(clock.current * 0.5) * 0.005;
      group.current.rotation.y = Math.sin(clock.current * 0.3) * 0.02;
    }

    scene.traverse((child) => {
      // Lip sync on morph targets (if mesh has them)
      if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        const dict = child.morphTargetDictionary;
        // Standard names for jaw/mouth opening
        const jawOpenIdx = dict["jawOpen"] || dict["mouthOpen"] || dict["viseme_aa"] || dict["MouthOpen"];
        if (jawOpenIdx !== undefined) {
          child.morphTargetInfluences[jawOpenIdx] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[jawOpenIdx], 
            lipMovement, 
            0.15
          );
        }
      }

      if (child.isBone) {
        // Realistic teaching-based animations

        if (gesturePhase === 0) { // CALM EXPLAINING with hands in front
          if (child.name === "RightForeArm") {
            child.rotation.x = Math.sin(clock.current * 1.8) * 0.2 - 0.1;
            child.rotation.z = Math.sin(clock.current * 1.5) * 0.12 + 0.05;
            child.rotation.y = -0.15;
          }
          if (child.name === "LeftForeArm") {
            child.rotation.x = Math.cos(clock.current * 1.7) * 0.2 - 0.1;
            child.rotation.z = Math.cos(clock.current * 1.6) * 0.12 - 0.05;
            child.rotation.y = 0.15;
          }
          if (child.name === "RightArm") {
            child.rotation.z = Math.sin(clock.current * 1.3) * 0.1 + 0.15;
            child.rotation.x = -0.15;
          }
          if (child.name === "LeftArm") {
            child.rotation.z = Math.cos(clock.current * 1.2) * 0.1 - 0.15;
            child.rotation.x = -0.15;
          }
          if (child.name === "Head") {
            child.rotation.x = Math.sin(clock.current * 0.9) * 0.06;
            child.rotation.y = Math.sin(clock.current * 0.7) * 0.08;
          }
        } 
        else if (gesturePhase === 1) { // EMPHASIZING with one hand
          if (child.name === "RightForeArm") {
            child.rotation.x = -0.35; // Index finger pointing
            child.rotation.z = 0.1;
            child.rotation.y = 0.1;
          }
          if (child.name === "LeftForeArm") {
            child.rotation.x = -0.1;
            child.rotation.z = Math.sin(clock.current * 1.5) * 0.08;
          }
          if (child.name === "RightArm") {
            child.rotation.z = Math.sin(clock.current * 1.4) * 0.12 + 0.25;
            child.rotation.x = -0.05;
          }
          if (child.name === "LeftArm") {
            child.rotation.z = -0.15;
            child.rotation.x = -0.2;
          }
          if (child.name === "Head") {
            child.rotation.x = Math.sin(clock.current * 0.8) * 0.08;
            child.rotation.y = Math.sin(clock.current * 1.0) * 0.12;
          }
        } 
        else if (gesturePhase === 2) { // SIDE-TO-SIDE PRESENTING
          if (child.name === "RightForeArm") {
            child.rotation.x = 0.05;
            child.rotation.z = Math.sin(clock.current * 1.2) * 0.12;
            child.rotation.y = -0.1;
          }
          if (child.name === "LeftForeArm") {
            child.rotation.x = 0.05;
            child.rotation.z = Math.cos(clock.current * 1.2) * 0.12;
            child.rotation.y = 0.1;
          }
          if (child.name === "RightArm") {
            child.rotation.z = Math.sin(clock.current * 1.1) * 0.08 + 0.2;
            child.rotation.x = 0.05;
          }
          if (child.name === "LeftArm") {
            child.rotation.z = Math.cos(clock.current * 1.0) * 0.08 - 0.2;
            child.rotation.x = 0.05;
          }
          if (child.name === "Head") {
            child.rotation.x = Math.sin(clock.current * 0.7) * 0.05;
            child.rotation.y = Math.sin(clock.current * 1.3) * 0.1;
          }
        } 
        else { // THINKING pose with hand gesture
          if (child.name === "RightForeArm") {
            child.rotation.x = Math.sin(clock.current * 1.2) * 0.15 - 0.2;
            child.rotation.z = -0.25; // Hand near chin
          }
          if (child.name === "LeftForeArm") {
            child.rotation.x = -0.15;
            child.rotation.z = 0.1;
          }
          if (child.name === "RightArm") {
            child.rotation.z = -0.25;
            child.rotation.x = Math.sin(clock.current * 0.9) * 0.1;
          }
          if (child.name === "LeftArm") {
            child.rotation.z = -0.1;
            child.rotation.x = -0.1;
          }
          if (child.name === "Head") {
            child.rotation.x = Math.sin(clock.current * 1.1) * 0.1;
            child.rotation.y = Math.sin(clock.current * 0.6) * 0.12;
            child.rotation.z = Math.sin(clock.current * 0.8) * 0.08;
          }
        }
      }
    });
  });

  return (
    <group ref={group} position={[0, -1.0, 0]}>
      <primitive object={scene} scale={0.01} />
    </group>
  );
}

// ─── Exported wrapper ─────────────────────────────────────────────────────────
export default function AriaAvatar({ speaking, emotion, style }) {
  return (
    <div
      style={{
        width: "220px",
        height: "380px",
        position: "relative",
        ...style,
      }}
    >
      {/* Subtle glow ring beneath avatar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "140px",
          height: "24px",
          borderRadius: "50%",
          background: speaking
            ? "radial-gradient(ellipse, rgba(240,147,251,0.5) 0%, transparent 70%)"
            : "radial-gradient(ellipse, rgba(103,126,234,0.35) 0%, transparent 70%)",
          filter: "blur(6px)",
          transition: "background 0.5s ease",
          zIndex: 0,
        }}
      />

      <Canvas
        camera={{ position: [0, 0.05, 3.2], fov: 40 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[1, 3, 2]} intensity={1.2} />
        <directionalLight
          position={[-1, 1, -1]}
          intensity={0.4}
          color="#b39ddb"
        />

        <Suspense fallback={null}>
          <AvatarModel speaking={speaking} emotion={emotion} />
          <ContactShadows
            position={[0, -1.0, 0]}
            opacity={0.25}
            scale={2}
            blur={2}
            far={1.5}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>


    </div>
  );
}

// FBX model is loaded dynamically via useLoader
