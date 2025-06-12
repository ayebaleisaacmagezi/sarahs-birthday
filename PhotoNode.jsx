/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useLoader } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { motion } from "framer-motion-3d";
import { TextureLoader } from "three";
import { setTargetImage } from "./actions";
import { useEffect, useState } from "react";

const maxThumbDimension = 32;
const nodeScaleFactor = 600;

export default function PhotoNode({
  id,
  x = 0,
  y = 0,
  z = 0,
  highlight,
  dim,
  // description prop removed
}) {
  const texture = useLoader(TextureLoader, id);
  const opacity = highlight ? 1 : dim ? 0.1 : 1;
  const [planeSize, setPlaneSize] = useState({ width: maxThumbDimension, height: maxThumbDimension });

  useEffect(() => {
    if (texture && texture.image) {
      const { naturalWidth, naturalHeight } = texture.image;
      let displayThumbWidth, displayThumbHeight;

      if (naturalWidth >= naturalHeight) {
        displayThumbWidth = maxThumbDimension;
        displayThumbHeight = maxThumbDimension * (naturalHeight / naturalWidth);
      } else {
        displayThumbHeight = maxThumbDimension;
        displayThumbWidth = maxThumbDimension * (naturalWidth / naturalHeight);
      }
      setPlaneSize({ width: displayThumbWidth, height: displayThumbHeight });
    }
  }, [texture]);

  return !texture ? null : (
    <motion.group
      onClick={(e) => {
        e.stopPropagation();
        setTargetImage(id);
      }}
      position={[x * nodeScaleFactor, y * nodeScaleFactor, z * nodeScaleFactor]}
      animate={{
        x: x * nodeScaleFactor,
        y: y * nodeScaleFactor,
        z: z * nodeScaleFactor,
        transition: { duration: 1, ease: "circInOut" },
      }}
    >
      <Billboard>
        <mesh scale={[planeSize.width, planeSize.height, 1]}>
          <planeGeometry />
          <motion.meshStandardMaterial
            map={texture}
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            transition={{ duration: 0.5 }}
            color={"#fff"}
          />
        </mesh>
      </Billboard>
      {/* The Text component has been removed */}
    </motion.group>
  );
}
