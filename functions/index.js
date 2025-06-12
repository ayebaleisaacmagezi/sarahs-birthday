/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { getStorage } = require("firebase-admin/storage");
const { initializeApp } = require("firebase-admin/app");
const logger = require("firebase-functions/logger");

// Initialize the Firebase Admin SDK
initializeApp();

/**
 * Generates a point on a sphere using a random approach.
 * @returns {Array<number>} An array [x, y, z].
 */
function generateRandomSpherePoint() {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = Math.sin(phi) * Math.cos(theta);
  const y = Math.sin(phi) * Math.sin(theta);
  const z = Math.cos(phi);
  return [x, y, z];
}

exports.generateCoordinates = onObjectFinalized(async (event) => {
  const fileBucket = event.data.bucket;
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  logger.info(`New file detected: ${filePath}`);

  // 1. Exit if this is not an image.
  if (!contentType || !contentType.startsWith("image/")) {
    return logger.log("This is not an image. Exiting.");
  }

  // 2. Get a reference to the file in Storage.
  const bucket = getStorage().bucket(fileBucket);
  const file = bucket.file(filePath);

  // 3. Check if coordinate metadata already exists.
  const [metadata] = await file.getMetadata();
  if (metadata.metadata && metadata.metadata.sphere_x) {
    return logger.log("File already has coordinates. Exiting.");
  }

  // 4. Generate random spherical coordinates.
  const [x, y, z] = generateRandomSpherePoint();
  logger.info(`Generated sphere coordinates: [${x}, ${y}, ${z}]`);

  // 5. Update the file with the new coordinate metadata.
  const newMetadata = {
    metadata: {
      sphere_x: String(x),
      sphere_y: String(y),
      sphere_z: String(z),
    },
  };

  try {
    await file.setMetadata(newMetadata);
    logger.log("Successfully updated coordinate metadata for", filePath);
  } catch (err) {
    logger.error("ERROR updating metadata:", err);
  }
});
