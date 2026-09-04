document.addEventListener("DOMContentLoaded", () => {
  const marker = document.getElementById("hiroMarker");
  const heritageObject = document.getElementById("heritageObject");
  const status = document.getElementById("arStatus");
  const scanGuide = document.getElementById("scanGuide");

  const rotateButton = document.getElementById("rotateButton");
  const pauseButton = document.getElementById("pauseButton");
  const infoButton = document.getElementById("infoButton");
  const closeInfoButton = document.getElementById("closeInfoButton");
  const infoPanel = document.getElementById("infoPanel");

  if (
    !marker ||
    !heritageObject ||
    !status ||
    !rotateButton ||
    !pauseButton ||
    !infoButton ||
    !closeInfoButton ||
    !infoPanel
  ) {
    console.error(
      "HeritageLens Exhibit Mode could not initialise because one or more required elements are missing."
    );
    return;
  }

  let isAnimationPaused = false;
  let isMarkerVisible = false;

  const rotationAnimation =
    "property: rotation; to: -90 360 0; dur: 12000; easing: linear; loop: true";

  function setStatus(message) {
    status.textContent = message;
  }

  function showScanGuide() {
    if (scanGuide) {
      scanGuide.style.display = "flex";
    }
  }

  function hideScanGuide() {
    if (scanGuide) {
      scanGuide.style.display = "none";
    }
  }

  function updatePauseButton(isPaused) {
    if (isPaused) {
      pauseButton.innerHTML = `
        <span class="control-icon" aria-hidden="true">▶</span>
        Resume Motion
      `;
      return;
    }

    pauseButton.innerHTML = `
      <span class="control-icon" aria-hidden="true">Ⅱ</span>
      Pause Motion
    `;
  }

  marker.addEventListener("markerFound", () => {
    isMarkerVisible = true;
    hideScanGuide();

    setStatus(
      "Exhibit detected. Explore the Heritage Elephant from every angle."
    );
  });

  marker.addEventListener("markerLost", () => {
    isMarkerVisible = false;
    showScanGuide();

    setStatus(
      "Exhibit Marker not visible. Centre the marker in your camera view."
    );
  });

  rotateButton.addEventListener("click", () => {
    const rotation = heritageObject.getAttribute("rotation");

    heritageObject.setAttribute("rotation", {
      x: rotation.x,
      y: (rotation.y + 45) % 360,
      z: rotation.z
    });

    if (isMarkerVisible) {
      setStatus("Viewing the Heritage Elephant from another angle.");
    } else {
      setStatus(
        "Your new viewing angle is ready. Scan the Exhibit Marker to continue."
      );
    }
  });

  pauseButton.addEventListener("click", () => {
    if (isAnimationPaused) {
      heritageObject.setAttribute("animation", rotationAnimation);

      isAnimationPaused = false;
      updatePauseButton(false);

      setStatus("Heritage Elephant motion resumed.");
      return;
    }

    heritageObject.removeAttribute("animation");

    isAnimationPaused = true;
    updatePauseButton(true);

    setStatus("Heritage Elephant motion paused.");
  });

  infoButton.addEventListener("click", () => {
    infoPanel.hidden = false;
    setStatus("Heritage Elephant details opened.");
  });

  closeInfoButton.addEventListener("click", () => {
    infoPanel.hidden = true;

    if (isMarkerVisible) {
      setStatus("Continue exploring the Heritage Elephant.");
    } else {
      setStatus("Point your camera at the HeritageLens Exhibit Marker.");
    }
  });
});