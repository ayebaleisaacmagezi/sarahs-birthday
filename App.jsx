/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState, useEffect } from "react";
import c from "clsx";
import PhotoViz from "./PhotoViz";
import useStore from "./store";
import Sidebar from "./Sidebar";

import {
  setLayout,
  toggleSidebar,
} from "./actions";

export default function App() {
  console.log('[App.jsx] App component rendering...');
  const layout = useStore.use.layout();
  const isSidebarOpen = useStore.use.isSidebarOpen();
  const images = useStore.use.images();

  useEffect(() => {
    console.log('[App.jsx] Images from store:', images);
  }, [images]);

  return (
    <main>
      <PhotoViz />
      <Sidebar />
      <footer>
        {/* Caption display removed as AI features are gone */}
        <div className="controls">
          <div></div>
          <div>
            <button
              onClick={() => setLayout("sphere")}
              className={c({ active: layout === "sphere" })}
            >
              sphere
            </button>
            <button
              onClick={() => setLayout("grid")}
              className={c({ active: layout === "grid" })}
            >
              grid
            </button>
          </div>
          <div>
          </div>
        </div>
      </footer>
      <button
        onClick={toggleSidebar}
        className={c("sidebarButton iconButton", { active: isSidebarOpen })}
        aria-label="Toggle photo list"
        title="Toggle photo list"
      >
        <span className="icon">list</span>
      </button>
    </main>
  );
}
