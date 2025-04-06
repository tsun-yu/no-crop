// --- DOM Elements ---
const photoInput = document.getElementById("photoInput");
const fileInputButtonSpan = document.getElementById("fileInputButtonSpan");
// Change to target the canvas instead of img
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const previewPlaceholder = document.getElementById("previewPlaceholder");

const fillOption = document.getElementById("fillOption");

const blurControl = document.getElementById("blurControl");
const blurRange = document.getElementById("blurRange");
const blurValueDisplay = document.getElementById("blurValue");
const blurInput = document.getElementById("blurInput"); // Added precise input

const scaleRange = document.getElementById("scaleRange");
const scaleValueDisplay = document.getElementById("scaleValue");
const scaleInput = document.getElementById("scaleInput");

const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");

// --- Global state ---
let originalImage = null;
let offscreenCanvas = document.createElement("canvas"); // Use offscreen canvas for processing
let offscreenCtx = offscreenCanvas.getContext("2d", {
  willReadFrequently: true,
}); // Optimize for readback if needed, though maybe not critical here

// --- Default values ---
const defaultBlur = 20;
const defaultScale = 100; // Default scale is 100%
const defaultFill = "blur";

// --- Utility Functions ---

function setControlsDisabled(disabled, keepFileInputEnabled = false) {
  const isBlurFill = fillOption.value === "blur";
  const actualBlurDisabled = disabled || !isBlurFill;

  photoInput.disabled = disabled && !keepFileInputEnabled;
  fillOption.disabled = disabled;

  // Disable blur controls based on calculated state
  blurRange.disabled = actualBlurDisabled;
  blurInput.disabled = actualBlurDisabled; // Disable number input too
  // Optionally visually hide/show or dim the blur control group
  blurControl.style.opacity = actualBlurDisabled ? 0.5 : 1;
  blurControl.style.pointerEvents = actualBlurDisabled ? "none" : "auto";

  scaleInput.disabled = disabled;
  scaleRange.disabled = disabled;
  downloadButton.disabled = disabled;
  resetButton.disabled = disabled;

  // Update visual cues managed by CSS :disabled pseudo-class automatically
}

function updateValueDisplays() {
  blurValueDisplay.textContent = blurRange.value;
  scaleValueDisplay.textContent = scaleRange.value;
  // No need to update input values here, they are synced via listeners
}

// Debounce function remains the same
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- Core Drawing Logic ---
const drawImageOnCanvas = () => {
  if (!originalImage) {
    // Ensure canvas is hidden and placeholder shown if no image
    previewCanvas.style.display = "none";
    previewCanvas.setAttribute("data-empty", "true");
    previewPlaceholder.style.display = "block";
    return;
  }

  const img = originalImage;
  const size = Math.max(img.naturalWidth, img.naturalHeight); // Use natural dimensions

  // Set dimensions for the offscreen canvas
  offscreenCanvas.width = size;
  offscreenCanvas.height = size;

  // Clear the offscreen canvas
  offscreenCtx.clearRect(0, 0, size, size);
  offscreenCtx.filter = "none"; // Reset filter

  const currentFillOption = fillOption.value;
  const currentBlurValue = parseInt(blurRange.value, 10);
  const currentScalePercentage = parseInt(scaleInput.value, 10) / 100;

  // 1. Draw Background (if needed)
  if (currentFillOption === "blur" && currentBlurValue > 0) {
    // Scale background image to cover canvas - maintain aspect ratio
    const scaleToFill = size / Math.min(img.naturalWidth, img.naturalHeight);
    const bgWidth = img.naturalWidth * scaleToFill;
    const bgHeight = img.naturalHeight * scaleToFill;
    const bgXOffset = (size - bgWidth) / 2;
    const bgYOffset = (size - bgHeight) / 2;

    offscreenCtx.save(); // Save context state before applying blur
    offscreenCtx.filter = `blur(${currentBlurValue}px)`;
    // Clip drawing to canvas bounds to prevent blur leaking outside (optional but good practice)
    // offscreenCtx.beginPath();
    // offscreenCtx.rect(0, 0, size, size);
    // offscreenCtx.clip();
    offscreenCtx.drawImage(img, bgXOffset, bgYOffset, bgWidth, bgHeight);
    offscreenCtx.restore(); // Restore context state (removes filter and clip)
  } else if (currentFillOption === "white") {
    offscreenCtx.fillStyle = "#FFFFFF";
    offscreenCtx.fillRect(0, 0, size, size);
  } else if (currentFillOption === "black") {
    offscreenCtx.fillStyle = "#000000";
    offscreenCtx.fillRect(0, 0, size, size);
  }
  // 'transparent' requires no background drawing, just clearing.

  // 2. Draw Foreground Image (scaled and centered)
  const scaledWidth = img.naturalWidth * currentScalePercentage;
  const scaledHeight = img.naturalHeight * currentScalePercentage;
  const xOffset = (size - scaledWidth) / 2;
  const yOffset = (size - scaledHeight) / 2;

  offscreenCtx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);

  // 3. Update the Preview Canvas
  // Ensure preview canvas has the correct size
  previewCanvas.width = size;
  previewCanvas.height = size;

  // Clear preview canvas before drawing
  previewCtx.clearRect(0, 0, size, size);
  // Draw the result from the offscreen canvas to the visible one
  previewCtx.drawImage(offscreenCanvas, 0, 0);

  // Show canvas, hide placeholder
  previewCanvas.style.display = "block";
  previewCanvas.removeAttribute("data-empty");
  previewPlaceholder.style.display = "none";
};

// Use debounce for drawing on slider/input changes
const debouncedDrawImage = debounce(drawImageOnCanvas, 50); // Adjust debounce time (ms) as needed

// --- Event Listeners Setup ---
function setupEventListeners() {
  // File Input
  photoInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      previewPlaceholder.textContent = "圖片載入中...";
      previewPlaceholder.style.display = "block";
      previewCanvas.style.display = "none";
      previewCanvas.setAttribute("data-empty", "true");
      setControlsDisabled(true); // Disable ALL controls during load

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img; // Store the loaded image object
          resetControlsToDefault(); // Reset sliders/selects to defaults first
          updateValueDisplays(); // Update displays for defaults
          setControlsDisabled(false); // Enable controls now image is loaded
          drawImageOnCanvas(); // Perform initial draw

          // Update file input button text
          const maxLen = 20; // Adjust max length if needed
          fileInputButtonSpan.textContent =
            file.name.length > maxLen
              ? file.name.substring(0, maxLen - 3) + "..."
              : file.name;
        };
        img.onerror = () => {
          alert("無法載入圖片。檔案可能已損壞或格式不支援。");
          resetToInitialState();
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        alert("讀取檔案時發生錯誤。");
        resetToInitialState();
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("請選擇有效的圖片檔案 (例如 JPG, PNG, GIF, WEBP)。");
      photoInput.value = ""; // Clear selection
      // If an image was loaded previously, keep controls enabled, otherwise reset
      if (!originalImage) {
        resetToInitialState();
      } else {
        setControlsDisabled(false); // Keep controls enabled if image already loaded
        fileInputButtonSpan.textContent = "選擇檔案"; // Reset button text
      }
    } else {
      // User cancelled file dialog - do nothing if image already loaded
      if (!originalImage) {
        resetToInitialState();
      }
      // If an image *was* loaded, don't reset, just leave things as they are.
    }
  });

  // Fill Option Select
  fillOption.addEventListener("change", () => {
    // When fill option changes, update which controls are enabled/disabled
    setControlsDisabled(false); // Re-evaluate based on new fill option
    drawImageOnCanvas(); // Redraw immediately (no debounce needed for select change)
  });

  // Blur Controls (Range and Input)
  blurRange.addEventListener("input", () => {
    blurInput.value = blurRange.value; // Sync input
    updateValueDisplays();
    debouncedDrawImage();
  });
  blurInput.addEventListener("input", () => {
    // Validate input
    let value = parseInt(blurInput.value, 10);
    const min = parseInt(blurInput.min, 10);
    const max = parseInt(blurInput.max, 10);
    if (isNaN(value)) value = min; // Default to min if invalid
    value = Math.max(min, Math.min(max, value)); // Clamp value
    blurInput.value = value; // Update input field with clamped value

    blurRange.value = value; // Sync range slider
    updateValueDisplays();
    debouncedDrawImage();
  });
  // Update on 'change' too in case user types and blurs
  blurInput.addEventListener("change", () => {
    // Ensure final value is clamped and synced
    let value = parseInt(blurInput.value, 10);
    const min = parseInt(blurInput.min, 10);
    const max = parseInt(blurInput.max, 10);
    if (isNaN(value)) value = min;
    value = Math.max(min, Math.min(max, value));
    blurInput.value = value;
    blurRange.value = value;
    updateValueDisplays();
    drawImageOnCanvas(); // Non-debounced redraw on final change is fine
  });

  // Scale Controls (Range and Input)
  scaleRange.addEventListener("input", () => {
    scaleInput.value = scaleRange.value; // Sync input
    updateValueDisplays();
    debouncedDrawImage();
  });
  scaleInput.addEventListener("input", () => {
    // Validate input
    let value = parseInt(scaleInput.value, 10);
    const min = parseInt(scaleInput.min, 10);
    const max = parseInt(scaleInput.max, 10);
    if (isNaN(value)) value = min; // Default to min if invalid
    value = Math.max(min, Math.min(max, value)); // Clamp value
    scaleInput.value = value; // Update input field with clamped value

    scaleRange.value = value; // Sync range slider
    updateValueDisplays();
    debouncedDrawImage();
  });
  // Update on 'change' too
  scaleInput.addEventListener("change", () => {
    let value = parseInt(scaleInput.value, 10);
    const min = parseInt(scaleInput.min, 10);
    const max = parseInt(scaleInput.max, 10);
    if (isNaN(value)) value = min;
    value = Math.max(min, Math.min(max, value));
    scaleInput.value = value;
    scaleRange.value = value;
    updateValueDisplays();
    drawImageOnCanvas(); // Non-debounced redraw on final change
  });

  // Reset Button
  resetButton.addEventListener("click", () => {
    if (originalImage) {
      resetControlsToDefault();
      updateValueDisplays();
      drawImageOnCanvas(); // Redraw with defaults
    }
  });

  // Download Button
  downloadButton.addEventListener("click", () => {
    if (!originalImage || previewCanvas.getAttribute("data-empty") === "true")
      return; // Don't download if no image

    const isTransparent = fillOption.value === "transparent";
    const mimeType = isTransparent ? "image/png" : "image/png"; // Always use PNG for potential transparency and simplicity
    const fileExtension = "png";
    const quality = isTransparent ? undefined : 0.92; // PNG quality is lossless, but toDataURL might have options for JPEG

    try {
      const dataURL = offscreenCanvas.toDataURL(mimeType, quality); // Get data from offscreen canvas

      const link = document.createElement("a");
      // Try to get original filename, otherwise use a default
      const originalFileName =
        photoInput.files[0]?.name.split(".").slice(0, -1).join(".") || "image";
      link.download = `${originalFileName}-1x1.${fileExtension}`;
      link.href = dataURL;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link); // Clean up
    } catch (e) {
      console.error("Error generating image for download:", e);
      alert("產生下載圖片時發生錯誤。");
    }
  });
}

// --- State Management Functions ---
function resetControlsToDefault() {
  // Reset controls to their default values
  fillOption.value = defaultFill;
  blurRange.value = defaultBlur;
  blurInput.value = defaultBlur; // Reset blur input
  scaleRange.value = defaultScale;
  scaleInput.value = defaultScale;

  // Manually trigger change on fillOption to update blur control state correctly
  fillOption.dispatchEvent(new Event("change"));
}

function resetToInitialState() {
  originalImage = null;
  // Clear preview canvas and show placeholder
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCanvas.style.display = "none";
  previewCanvas.setAttribute("data-empty", "true");
  previewPlaceholder.textContent = "請先上傳一張圖片";
  previewPlaceholder.style.display = "block";

  fileInputButtonSpan.textContent = "選擇檔案";
  photoInput.value = ""; // Clear file input selection

  resetControlsToDefault(); // Reset sliders/selects to defaults
  updateValueDisplays();
  // Disable controls EXCEPT the file input on initial state
  setControlsDisabled(true, true); // keepFileInputEnabled = true
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  resetToInitialState(); // Set initial state (controls disabled except file input)
  setupEventListeners(); // Add all event listeners
});
