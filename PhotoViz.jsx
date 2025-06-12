/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber'
// --- 1. IMPORT OrbitControls INSTEAD OF MapControls ---
import {OrbitControls} from '@react-three/drei'
import {useRef, useEffect} from 'react' // Removed unused useState
import {animate} from 'motion'
import useStore from './store'
import PhotoNode from './PhotoNode'
import {setTargetImage} from './actions'

function SceneContent() {
  const images = useStore.use.images()
  const nodePositions = useStore.use.nodePositions()
  const layout = useStore.use.layout()
  const targetImage = useStore.use.targetImage()
  const resetCam = useStore.use.resetCam()
  const {camera} = useThree()
  const groupRef = useRef()
  const controlsRef = useRef()

  // ... (No changes to the useEffect hooks or other logic) ...
  useEffect(() => {
    // This hook remains the same
  }, [images, nodePositions]);
  
  useEffect(() => {
    // This focus-on-target hook remains the same
  }, [targetImage, images, nodePositions, layout, camera, controlsRef, groupRef]);
  
  useEffect(() => {
    // This layout-change hook remains the same
  }, [layout, camera, resetCam]);


  // The useFrame hook only needs to update the controls.
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  
  if (!images) {
    return null;
  }

  return (
    <>
      <ambientLight intensity={2.3} />
      {/* --- 2. USE OrbitControls WITH THE CORRECT PROPERTIES --- */}
      <OrbitControls
        ref={controlsRef}
        minDistance={20}
        maxDistance={500}
        enablePan={true} // Pan is right-click on desktop, two-finger-drag on mobile (which is fine)
      />
      <group ref={groupRef}>
        {images?.map((image, imageIndex) => {
          const nodePosArr = nodePositions?.[image.id];
          if (!nodePosArr) {
            return null; 
          }

          let pX, pY, pZ;
          if (layout === 'sphere') {
            const pseudoRandomFactor = ((imageIndex * 137) % 100) / 100.0;
            const minRadialDist = 0.1;
            const maxRadialDist = 0.5;
            const radialDist = minRadialDist + pseudoRandomFactor * (maxRadialDist - minRadialDist);

            pX = nodePosArr[0] * radialDist; 
            pY = nodePosArr[1] * radialDist;
            pZ = (nodePosArr[2] || 0) * radialDist;
          } else { // grid
            pX = nodePosArr[0]; 
            pY = nodePosArr[1]; 
            pZ = nodePosArr[2] || 0; 
          }
          
          const isTarget = targetImage === image.id;
          const hasTarget = targetImage !== null;

          return (
            <PhotoNode
              key={image.id}
              id={image.id}
              x={pX}
              y={pY}
              z={pZ}
              highlight={isTarget}
              dim={hasTarget && !isTarget}
            />
          )
        })}
      </group>
    </>
  )
}

// The rest of the file remains unchanged
export default function PhotoViz() {
  return (
    <Canvas
      camera={{position: [0, 0, 300], near: 0.1, far: 10000}}
      onPointerMissed={() => setTargetImage(null)}
    >
      <SceneContent />
    </Canvas>
  ) 
}