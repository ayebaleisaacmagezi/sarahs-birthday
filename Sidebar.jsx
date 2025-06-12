/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from "react";
import c from "clsx";
import useStore from "./store";
import { setSidebarOpen, setTargetImage } from "./actions";

const Sidebar = () => {
  const images = useStore.use.images();
  const isSidebarOpen = useStore.use.isSidebarOpen();

  return (
    <aside className={c("sidebar", { open: isSidebarOpen })}>
      <button
        className="closeButton"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      >
        <span className="icon">close</span>
      </button>

      <ul>
        {images?.map((image) => (
          <li key={image.id} onClick={() => setTargetImage(image.id)}>
            <img
              src={image.id}
              alt="thumbnail"
              className="thumbnail"
            />
            {/* The description paragraph has been removed */}
          </li>
        ))}
        {(!images || images.length === 0) && <li>No images available.</li>}
      </ul>
    </aside>
  );
};

export default Sidebar;
