/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store'
import { storage } from './firebase'; // <-- IMPORT FIREBASE STORAGE
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage"; // <-- IMPORT FIREBASE FUNCTIONS

const get = useStore.getState
const set = useStore.setState

export const init = async () => {
  console.log('[actions.js] init: Starting initialization.');
  if (get().didInit) {
    console.log('[actions.js] init: Already initialized.');
    return
  }

  set(state => {
    state.didInit = true
  })
  console.log('[actions.js] init: didInit set to true.');

  try {
    console.log('[actions.js] init: Starting to fetch from Firebase Storage...');
    
    // Create a reference to the root of your storage bucket
    const listRef = ref(storage);

    // List all items (images) in the bucket
    const res = await listAll(listRef);
    console.log(`[actions.js] init: Found ${res.items.length} items in Firebase Storage.`);

    // Create a promise for each item to fetch its URL and metadata
    const promises = res.items.map(itemRef => 
      Promise.all([
        getDownloadURL(itemRef),
        getMetadata(itemRef)
      ])
    );

    // Wait for all promises to resolve
    const allItemsData = await Promise.all(promises);
    console.log('[actions.js] init: All URLs and metadata fetched successfully.');

    // --- Process the fetched data ---
    const images = [];
    const sphereLayoutData = {};

    allItemsData.forEach(([url, metadata]) => {
      const customMeta = metadata.customMetadata;

      // CORRECTED CHECK: Only look for coordinates.
      if (customMeta && customMeta.sphere_x && customMeta.sphere_y && customMeta.sphere_z) {
        // CORRECTED PUSH: Only push the ID (URL).
        images.push({
          id: url,
        });

        sphereLayoutData[url] = [
          parseFloat(customMeta.sphere_x),
          parseFloat(customMeta.sphere_y),
          parseFloat(customMeta.sphere_z)
        ];
      } else {
        console.warn(`[actions.js] Skipping item ${metadata.name} due to missing coordinate metadata.`);
      }
    });

    // Calculate grid positions (this logic remains the same)
    const numColumns = 10;
    const gridNormalizationScale = 0.9;
    const cellWidth = gridNormalizationScale / numColumns;
    const cellHeight = cellWidth;
    const gridPositions = {};

    if (images && images.length > 0) {
      const numRows = Math.ceil(images.length / numColumns);
      const actualGridWidth = numColumns * cellWidth;
      const actualGridHeight = numRows * cellHeight;
      images.forEach((image, index) => {
        const col = index % numColumns;
        const row = Math.floor(index / numColumns);
        const x = (col * cellWidth) - (actualGridWidth / 2) + (cellWidth / 2);
        const y = (actualGridHeight / 2) - (row * cellHeight) - (cellHeight / 2);
        const z = 0;
        gridPositions[image.id] = [x, y, z];
      });
    }

    set(state => {
      state.images = images
      state.layouts = {
        sphere: sphereLayoutData,
        grid: gridPositions
      }
      state.nodePositions = Object.fromEntries(
        images.map(({id}) => [id, [0.5, 0.5, 0.5]])
      )
    })
    console.log('[actions.js] init: State updated with Firebase data.');

    setLayout('sphere')
    console.log('[actions.js] init: Initial layout set to sphere.');
  } catch (error) {
    console.error('[actions.js] init: Critical error during Firebase initialization:', error);
  }
}

export const setLayout = layout =>
  set(state => {
    console.log(`[actions.js] setLayout: Changing layout to ${layout}.`);
    state.layout = layout
    state.nodePositions = state.layouts[layout]
    state.targetImage = null; // Deselect image when changing layout
    state.resetCam = true; // Reset camera when changing layout
  })

export const setSphereLayout = positions =>
  set(state => {
    state.layouts.sphere = positions
  })

// Removed sendQuery function as it's an AI feature
/*
export const sendQuery = async query => {
  set(state => {
    state.isFetching = true
    state.targetImage = null
    state.resetCam = true
    state.caption = null
  })
  try {
    const res = await queryLlm({prompt: queryPrompt(get().images, query)})
    try{
      const resJ = JSON.parse(res.replace('```json','').replace('```',''));
      set(state => {
        state.highlightNodes = resJ.filenames
        state.caption = resJ.commentary
      })
    }catch(e){
      console.error(e)
    }

  } finally {
    set(state => {
      state.isFetching = false
    })
  }
}
*/

// Removed clearQuery function as it's an AI feature
/*
export const clearQuery = () =>
  set(state => {
    state.highlightNodes = null
    state.caption = null
    state.targetImage = null
  })
*/

export const setTargetImage = async targetImageId => {
  let newTargetImage = targetImageId;
  if (targetImageId === get().targetImage) { // If clicking the same image, deselect it
    newTargetImage = null;
  }
  console.log(`[actions.js] setTargetImage: Setting target image to: ${newTargetImage}`);

  set(state => {
    state.targetImage = newTargetImage;
    if (newTargetImage === null) { // If we are deselecting (either by clicking same image or empty space)
      state.resetCam = true; // Trigger camera reset to zoom out
    }
    // state.isFetching = !!newTargetImage; // Removed: AI feature
    // state.highlightNodes = null; // Removed: AI feature
  });

  // No further logic needed here after AI removal
  // if (!newTargetImage) {
  //   return
  // }
  // set(state => { // Removed: isFetching was primarily for AI
  //   state.isFetching = false
  // })
}

export const toggleSidebar = () =>
  set(state => {
    state.isSidebarOpen = !state.isSidebarOpen
  })

export const setSidebarOpen = isOpen =>
  set(state => {
    state.isSidebarOpen = isOpen
  })

init()
