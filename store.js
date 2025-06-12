/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import 'immer'
import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {createSelectorFunctions} from 'auto-zustand-selectors-hook'

export default createSelectorFunctions(
  create(
    immer(() => ({
      didInit: false,
      images: null,
      layout: 'sphere',
      layouts: null,
      nodePositions: null,
      // highlightNodes: null, // Removed: AI feature
      // isFetching: false, // Removed: AI feature
      isSidebarOpen: false,
      targetImage: null,
      // caption: null, // Removed: AI feature
      resetCam: false,
    }))
  )
)