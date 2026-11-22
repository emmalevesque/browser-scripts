// ==UserScript==
// @name         Image Vim Navigation
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Vim-like keyboard navigation (j,k,g,G) for image sets on a page
// @author       You
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  class ImageNavigator {
    constructor() {
      this.imageSets = [];
      this.currentSetIndex = -1;
      this.currentImageIndex = -1;
      this.initialized = false;
      this.settings = {
        smoothScroll: false,
      };
      this.zoomedImage = null;
      this.zoomLevel = 1;

      this.detectImageSets();
      this.setupKeyboardListeners();
      this.setupClickDetection();
      this.injectStyles();
      this.setupSettingsToggle();
    }

    setupSettingsToggle() {
      document.addEventListener("keydown", (e) => {
        if (!this.initialized) return;
        // Press 'S' to toggle smooth scroll
        if (e.key === "s" && e.shiftKey) {
          e.preventDefault();
          this.settings.smoothScroll = !this.settings.smoothScroll;
          const mode = this.settings.smoothScroll ? "smooth" : "instant";
          this.showStatus(`Scroll mode: ${mode}`);
        }
        // Press escape to un-zoom if zoomed
        if (e.key === "Escape" && this.zoomedImage) {
          e.preventDefault();
          this.unzoomImage();
        }
      });
    }

    setupClickDetection() {
      document.addEventListener(
        "click",
        (e) => {
          if (e.altKey && e.target.tagName === "IMG") {
            e.preventDefault();
            e.stopPropagation();
            this.detectSetFromImage(e.target);
          }
        },
        true,
      );
    }

    detectSetFromImage(clickedImg) {
      const strategies = [
        // Strategy 1: Check if image is in a list
        () => {
          let parent = clickedImg.parentElement;
          while (parent) {
            if (
              ["UL", "OL"].includes(parent.tagName) ||
              parent.getAttribute("role") === "list"
            ) {
              const images = Array.from(parent.querySelectorAll("img"));
              if (images.length >= 1) return images;
            }
            parent = parent.parentElement;
          }
          return null;
        },
        // Strategy 2: Check for sibling paragraph-like elements
        () => {
          let parent = clickedImg.parentElement;
          if (parent && ["P", "DIV", "FIGURE"].includes(parent.tagName)) {
            const parentParent = parent.parentElement;
            if (parentParent) {
              const siblings = Array.from(parentParent.children).filter(
                (child) => child.tagName === parent.tagName,
              );
              const images = siblings.flatMap((sibling) =>
                Array.from(sibling.querySelectorAll("img")),
              );
              if (images.length >= 1) return images;
            }
          }
          return null;
        },
        // Strategy 3: Check for direct sibling images
        () => {
          let parent = clickedImg.parentElement;
          if (parent) {
            const images = Array.from(parent.children).filter(
              (child) => child.tagName === "IMG",
            );
            if (images.length >= 1) return images;
          }
          return null;
        },
        // Strategy 4: Check for images in flex/grid containers
        () => {
          let parent = clickedImg.parentElement;
          while (parent) {
            const style = parent.getAttribute("style") || "";
            const classList = parent.className || "";
            if (
              style.includes("display: flex") ||
              style.includes("display: grid") ||
              classList.match(/(gallery|lightbox|carousel|image-grid)/i)
            ) {
              const images = Array.from(parent.querySelectorAll("img"));
              if (images.length >= 1) return images;
            }
            parent = parent.parentElement;
          }
          return null;
        },
        // Strategy 5: Check parent container
        () => {
          const parent = clickedImg.parentElement;
          if (parent) {
            const images = Array.from(parent.querySelectorAll("img"));
            if (images.length >= 1) return images;
          }
          return null;
        },
      ];

      let detectedImages = null;
      for (const strategy of strategies) {
        detectedImages = strategy();
        if (detectedImages && detectedImages.length >= 2) {
          break;
        }
      }

      if (detectedImages && detectedImages.length >= 2) {
        // Filter for reasonably sized images
        detectedImages = detectedImages.filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 50 && rect.height > 50;
        });

        if (detectedImages.length >= 2) {
          // Create a custom set
          const customSet = {
            images: detectedImages,
            container: null,
            type: "custom-detected",
          };

          this.imageSets.push(customSet);
          const setIndex = this.imageSets.length - 1;
          const imageIndex = detectedImages.indexOf(clickedImg);

          this.focusImageSet(setIndex, imageIndex);
          this.showStatus(
            `Detected custom set with ${detectedImages.length} images`,
          );
          return;
        }
      }

      this.showStatus("Could not detect image set from this image");
    }

    detectImageSets() {
      const imageSets = [];
      const capturedImages = new Set();

      // Strategy 1: Images in <ul> or <ol> (or other list-like containers)
      const listContainers = document.querySelectorAll('ul, ol, [role="list"]');
      listContainers.forEach((container) => {
        const images = container.querySelectorAll("img");
        if (images.length >= 2) {
          imageSets.push({
            images: Array.from(images),
            container: container,
            type: "list",
          });
          images.forEach((img) => capturedImages.add(img));
        }
      });

      // Strategy 2: Images in sibling paragraph or similar elements (including wrapped in links)
      const parentContainers = new Set();
      document.querySelectorAll("img").forEach((img) => {
        if (!capturedImages.has(img)) {
          let parent = img.parentElement;
          // Traverse up to find the closest P, DIV, or FIGURE
          while (parent && !["P", "DIV", "FIGURE"].includes(parent.tagName)) {
            parent = parent.parentElement;
          }
          if (
            parent &&
            (parent.tagName === "P" ||
              parent.tagName === "DIV" ||
              parent.tagName === "FIGURE")
          ) {
            parentContainers.add(parent);
          }
        }
      });

      parentContainers.forEach((parent) => {
        // Look for sibling elements of the same type containing images
        const siblings = Array.from(parent.parentElement.children).filter(
          (child) => child.tagName === parent.tagName,
        );

        const images = siblings
          .flatMap((sibling) => Array.from(sibling.querySelectorAll("img")))
          .filter((img) => !capturedImages.has(img));

        if (images.length >= 2) {
          imageSets.push({
            images: images,
            container: parent.parentElement,
            type: "sibling-paragraphs",
          });
          images.forEach((img) => capturedImages.add(img));
        }
      });

      // Strategy 3: Direct sibling images in a common parent container
      const imgParents = new Set();
      document.querySelectorAll("img").forEach((img) => {
        if (!capturedImages.has(img)) {
          const parent = img.parentElement;
          if (parent) {
            imgParents.add(parent);
          }
        }
      });

      imgParents.forEach((parent) => {
        const images = Array.from(parent.children).filter(
          (child) => child.tagName === "IMG" && !capturedImages.has(child),
        );

        if (images.length >= 2) {
          imageSets.push({
            images: images,
            container: parent,
            type: "sibling",
          });
          images.forEach((img) => capturedImages.add(img));
        }
      });

      // Strategy 4: Images in common flex/grid containers
      const gridContainers = document.querySelectorAll(
        '[style*="display: flex"], [style*="display: grid"], ' +
          ".gallery, .lightbox, .carousel, .image-grid",
      );
      gridContainers.forEach((container) => {
        const images = Array.from(container.querySelectorAll("img")).filter(
          (img) => !capturedImages.has(img),
        );
        if (images.length >= 2) {
          imageSets.push({
            images: images,
            container: container,
            type: "grid",
          });
          images.forEach((img) => capturedImages.add(img));
        }
      });

      // Filter out very small images
      this.imageSets = imageSets.filter((set) => {
        return set.images.every((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 50 && rect.height > 50;
        });
      });

      if (this.imageSets.length > 0) {
        this.initialized = true;
        this.showStatus(
          `Found ${this.imageSets.length} image set(s). Use j/k to navigate, g to go first, G to go last.`,
        );
      }
    }

    setupKeyboardListeners() {
      document.addEventListener("keydown", (e) => {
        if (!this.initialized) return;

        // Don't interfere with text input
        if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

        switch (e.key) {
          case "j":
            e.preventDefault();
            this.nextImage();
            break;
          case "k":
            e.preventDefault();
            this.previousImage();
            break;
          case "g":
            e.preventDefault();
            this.firstImage();
            break;
          case "G":
            e.preventDefault();
            this.lastImage();
            break;
          case ".":
            if (e.altKey && e.shiftKey) {
              e.preventDefault();
              this.zoomToImage();
            }
            break;
        }
      });
    }

    nextImage() {
      if (this.currentSetIndex === -1) {
        this.focusImageSet(0, 0);
      } else {
        const currentSet = this.imageSets[this.currentSetIndex];
        const totalImages = currentSet.images.length;
        const nextIndex = (this.currentImageIndex + 1) % totalImages;
        this.focusImageSet(this.currentSetIndex, nextIndex);
      }
    }

    previousImage() {
      if (this.currentSetIndex === -1) {
        this.focusImageSet(0, 0);
      } else {
        const currentSet = this.imageSets[this.currentSetIndex];
        const totalImages = currentSet.images.length;
        const previousIndex =
          (this.currentImageIndex - 1 + totalImages) % totalImages;
        this.focusImageSet(this.currentSetIndex, previousIndex);
      }
    }

    firstImage() {
      if (this.imageSets.length > 0) {
        this.focusImageSet(0, 0);
      }
    }

    lastImage() {
      if (this.imageSets.length > 0) {
        const lastSetIndex = this.imageSets.length - 1;
        const lastImageIndex = this.imageSets[lastSetIndex].images.length - 1;
        this.focusImageSet(lastSetIndex, lastImageIndex);
      }
    }

    zoomToImage() {
      if (this.currentSetIndex === -1 || this.currentImageIndex === -1) {
        this.showStatus("No image focused");
        return;
      }

      const img = this.imageSets[this.currentSetIndex].images[
        this.currentImageIndex
      ];
      const rect = img.getBoundingClientRect();

      // Calculate zoom level based on image size and viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get the ideal zoom to fit image with some padding
      const padding = 50;
      const maxWidth = viewportWidth - padding * 2;
      const maxHeight = viewportHeight - padding * 2;

      const widthRatio = maxWidth / rect.width;
      const heightRatio = maxHeight / rect.height;

      const zoomLevel = Math.min(widthRatio, heightRatio);

      // Apply zoom via CSS transform on the image
      img.style.transform = `scale(${zoomLevel})`;
      img.style.transformOrigin = "center center";
      img.style.position = "relative";
      img.style.zIndex = "10001";

      // Scroll to center
      img.scrollIntoView({ behavior: "smooth", block: "center" });

      this.showStatus(`Zoomed to image (${Math.round(zoomLevel * 100)}%)`);

      // Store zoom state for un-zoom
      this.zoomedImage = img;
      this.zoomLevel = zoomLevel;
    }

    unzoomImage() {
      if (this.zoomedImage) {
        this.zoomedImage.style.transform = "";
        this.zoomedImage.style.transformOrigin = "";
        this.zoomedImage.style.position = "";
        this.zoomedImage.style.zIndex = "";
        this.zoomedImage = null;
        this.zoomLevel = 1;
        this.showStatus("Zoom reset");
      }
    }

    focusImageSet(setIndex, imageIndex) {
      if (setIndex < 0 || setIndex >= this.imageSets.length) return;

      const set = this.imageSets[setIndex];
      if (imageIndex < 0 || imageIndex >= set.images.length) return;

      // Remove previous focus
      if (this.currentSetIndex !== -1 && this.currentImageIndex !== -1) {
        const previousImage =
          this.imageSets[this.currentSetIndex].images[this.currentImageIndex];
        previousImage.classList.remove("vim-nav-focused");
      }

      // Apply new focus
      this.currentSetIndex = setIndex;
      this.currentImageIndex = imageIndex;
      const img = set.images[imageIndex];
      img.classList.add("vim-nav-focused");

      const behavior = this.settings.smoothScroll ? "smooth" : "instant";
      img.scrollIntoView({ behavior: behavior, block: "center" });

      const totalInSet = set.images.length;
      this.showStatus(
        `Image ${imageIndex + 1}/${totalInSet} in set ${setIndex + 1}/${this.imageSets.length}`,
      );
    }

    showStatus(message) {
      let statusEl = document.getElementById("vim-nav-status");
      if (!statusEl) {
        statusEl = document.createElement("div");
        statusEl.id = "vim-nav-status";
        document.body.appendChild(statusEl);
      }
      statusEl.textContent = message;
      statusEl.classList.add("vim-nav-visible");

      clearTimeout(this.statusTimeout);
      this.statusTimeout = setTimeout(() => {
        statusEl.classList.remove("vim-nav-visible");
      }, 3000);
    }

    injectStyles() {
      GM_addStyle(`
        img.vim-nav-focused {
          outline: 3px solid #ff6b6b !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 10px rgba(255, 107, 107, 0.5) !important;
        }

        #vim-nav-status {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 12px 16px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        #vim-nav-status.vim-nav-visible {
          opacity: 1;
        }
      `);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      new ImageNavigator();
    });
  } else {
    new ImageNavigator();
  }
})();
