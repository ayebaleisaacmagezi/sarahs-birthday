/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {MapControls} from '@react-three/drei'
import {useRef, useState, useEffect} from 'react'
import {animate} from 'motion'
import useStore from './store'
import PhotoNode from './PhotoNode'
import {setTargetImage} from './actions'

function SceneContent() {
  console.log('[PhotoViz.jsx] SceneContent rendering...');
  const images = useStore.use.images()
  const nodePositions = useStore.use.nodePositions()
  const layout = useStore.use.layout()
  const targetImage = useStore.use.targetImage()
  const resetCam = useStore.use.resetCam()
  const {camera} = useThree()
  const groupRef = useRef()
  const controlsRef = useRef()

  // --- REMOVED ---
  // The state and refs for manual rotation are no longer needed.
  // const [isAutoRotating, setIsAutoRotating] = useState(false)
  // const inactivityTimerRef = useRef(null)
  // const rotationVelocityRef = useRef(0)

  // const cameraDistance = 25
  // const targetSpeed = 0.1
  // const acceleration = 0.5
  // ---------------

  useEffect(() => {
    console.log('[PhotoViz.jsx] SceneContent: images from store:', images);
    console.log('[PhotoViz.jsx] SceneContent: nodePositions from store:', nodePositions);
  }, [images, nodePositions]);

  // --- REMOVED ---
  // The functions for the inactivity timer are no longer needed
  // as auto-rotation is removed.
  // const restartInactivityTimer = () => { ... }
  // const handleInteractionStart = () => { ... }
  // const handleInteractionEnd = () => { ... }
  // ---------------

  useEffect(() => {
    if (
      targetImage &&
      images &&
      nodePositions &&
      layout &&
      camera &&
      controlsRef.current &&
      groupRef.current // Keep groupRef check for safety
    ) {
      console.log(`[PhotoViz.jsx] Focusing on targetImage: ${targetImage}`);

      const nodePosArr = nodePositions[targetImage]
      if (!nodePosArr) {
        console.warn(`[PhotoViz.jsx] No node position found for targetImage: ${targetImage}`)
        return
      }
      
      let pX, pY, pZ;
      if (layout === 'sphere') {
        const targetImageIndex = images.findIndex(img => img.id === targetImage);
        if (targetImageIndex !== -1) {
            const pseudoRandomFactor = ((targetImageIndex * 137) % 100) / 100.0;
            const minRadialDist = 0.1;
            const maxRadialDist = 0.5;
            const radialDist = minRadialDist + pseudoRandomFactor * (maxRadialDist - minRadialDist);

            pX = nodePosArr[0] * radialDist;
            pY = nodePosArr[1] * radialDist;
            pZ = (nodePosArr[2] || 0) * radialDist;
        } else {
            pX = nodePosArr[0] * 0.5; 
            pY = nodePosArr[1] * 0.5;
            pZ = (nodePosArr[2] || 0) * 0.5;
        }
      } else { // grid
        pX = nodePosArr[0];
        pY = nodePosArr[1];
        pZ = nodePosArr[2] || 0;
      }

      const nodeLocalX = pX * 600
      const nodeLocalY = pY * 600
      const nodeLocalZ = pZ * 600
      
      // Since we no longer rotate the group, the calculation is simpler.
      // We don't need to account for group rotation.
      const targetNodeWorldVec = {
        x: nodeLocalX,
        y: nodeLocalY,
        z: nodeLocalZ + groupRef.current.position.z // Just add group's z offset
      }

      const duration = 0.8
      const ease = 'easeInOut'

      // Animate the controls target
      const currentControlsTarget = controlsRef.current.target.clone()
      const controlsTargetAnimations = [
        animate(currentControlsTarget.x, targetNodeWorldVec.x, {
          duration,
          ease,
          onUpdate: latest => { if (controlsRef.current) controlsRef.current.target.x = latest }
        }),
        animate(currentControlsTarget.y, targetNodeWorldVec.y, {
          duration,
          ease,
          onUpdate: latest => { if (controlsRef.current) controlsRef.current.target.y = latest }
        }),
        animate(currentControlsTarget.z, targetNodeWorldVec.z, {
          duration,
          ease,
          onUpdate: latest => { if (controlsRef.current) controlsRef.current.target.z = latest }
        })
      ];
      
      // Animate the camera position
      const cameraDistance = 25;
      const offsetDirection = camera.position.clone().sub(controlsRef.current.target).normalize().multiplyScalar(cameraDistance);
      const targetCameraPositionVec = {
        x: targetNodeWorldVec.x + offsetDirection.x,
        y: targetNodeWorldVec.y + offsetDirection.y,
        z: targetNodeWorldVec.z + offsetDirection.z
      }
      
      const cameraPositionAnimations = [
        animate(camera.position.x, targetCameraPositionVec.x, {
          duration,
          ease,
          onUpdate: latest => (camera.position.x = latest)
        }),
        animate(camera.position.y, targetCameraPositionVec.y, {
          duration,
          ease,
          onUpdate: latest => (camera.position.y = latest)
        }),
        animate(camera.position.z, targetCameraPositionVec.z, {
          duration,
          ease,
          onUpdate: latest => (camera.position.z = latest)
        })
      ];
      
      const allAnimations = [ ...controlsTargetAnimations, ...cameraPositionAnimations ];

      Promise.all(allAnimations.map(a => a.finished)).then(() => {
        if (controlsRef.current && camera) {
          camera.position.set(targetCameraPositionVec.x, targetCameraPositionVec.y, targetCameraPositionVec.z);
          controlsRef.current.target.set(targetNodeWorldVec.x, targetNodeWorldVec.y, targetNodeWorldVec.z);
        }
      });

    }
  }, [targetImage, images, nodePositions, layout, camera, controlsRef, groupRef]);

  useEffect(() => {
    const controls = controlsRef.current
    const targetLayoutPosition = [0, 0, 300]
    const targetControlsTarget = [0, 0, 0]
    const duration = 0.8
    const ease = 'easeInOut'

    if (controls && camera && resetCam) {
      console.log('[PhotoViz.jsx] Resetting camera view.');
      const currentCameraTarget = controls.target.clone()

      const cameraAndTargetAnimations = [
        animate(camera.position.x, targetLayoutPosition[0], { duration, ease, onUpdate: latest => (camera.position.x = latest) }),
        animate(camera.position.y, targetLayoutPosition[1], { duration, ease, onUpdate: latest => (camera.position.y = latest) }),
        animate(camera.position.z, targetLayoutPosition[2], { duration, ease, onUpdate: latest => (camera.position.z = latest) }),
        animate(currentCameraTarget.x, targetControlsTarget[0], { duration, ease, onUpdate: latest => { if (controlsRef.current) controlsRef.current.target.x = latest } }),
        animate(currentCameraTarget.y, targetControlsTarget[1], { duration, ease, onUpdate: latest => { if (controlsRef.current) controlsRef.current.target.y = latest } }),
        animate(currentCameraTarget.z, targetControlsTarget[2], { duration, ease, onUpdate: latest => { if (controlsRef.current) controlsRef.current.target.z = latest } })
      ];

      Promise.all(cameraAndTargetAnimations.map(a => a.finished)).then(() => {
        if (controlsRef.current && camera) {
          camera.position.set(...targetLayoutPosition)
          controlsRef.current.target.set(...targetControlsTarget)
        }
        useStore.setState(state=>{ state.resetCam = false; })
      });
    } else if (resetCam) {
        useStore.setState(state => { state.resetCam = false; });
    }

    // This group animation logic is still fine.
    if (groupRef.current) {
      console.log(`[PhotoViz.jsx] Animating group for layout: ${layout}`);
      animate(groupRef.current.position.z, layout === 'grid' ? 150 : 0, { duration: 0.8, ease: 'easeInOut', onUpdate: latest => (groupRef.current.position.z = latest) });
      animate(groupRef.current.rotation.x, 0, { duration: 0.8, ease: 'easeInOut', onUpdate: latest => (groupRef.current.rotation.x = latest) });
      animate(groupRef.current.rotation.y, 0, { duration: 0.8, ease: 'easeInOut', onUpdate: latest => (groupRef.current.rotation.y = latest) });
      animate(groupRef.current.rotation.z, 0, { duration: 0.8, ease: 'easeInOut', onUpdate: latest => (groupRef.current.rotation.z = latest) });
    }
  }, [layout, camera, resetCam])

  // The useFrame hook now only needs to update the controls.
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
      <MapControls
        ref={controlsRef}
        // onStart/onEnd removed as they were for auto-rotation
        minDistance={20}
        maxDistance={500}
        enablePan={true} // Enable pan for a better desktop experience (right-click drag)
        enableRotate={true}
        zoomToCursor={true}
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