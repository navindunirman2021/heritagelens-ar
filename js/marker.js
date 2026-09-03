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

  let isAnimationPaused = false;
  let isMarkerVisible = false;

  function setStatus(message) {
    status.textContent = message;
  }

  marker.addEventListener("markerFound", () => {
    isMarkerVisible = true;

    if (scanGuide) {
      scanGuide.style.display = "none";
    }

    setStatus("Exhibit detected. Explore the Golden Stupa from every angle.");
  });

  marker.addEventListener("markerLost", () => {
    isMarkerVisible = false;

    if (scanGuide) {
      scanGuide.style.display = "flex";
    }

    setStatus("Exhibit Marker not visible. Centre the marker in your camera view.");
  });

  rotateButton.addEventListener("click", () => {
    const rotation = heritageObject.getAttribute("rotation");

    heritageObject.setAttribute("rotation", {
      x: rotation.x,
      y: (rotation.y + 45) % 360,
      z: rotation.z
    });

    if (isMarkerVisible) {
      setStatus("Viewing the artefact from another angle.");
    } else {
      setStatus("Your new viewing angle is ready. Scan the Exhibit Marker to continue.");
    }
  });

  pauseButton.addEventListener("click", () => {
    if (isAnimationPaused) {
      heritageObject.setAttribute(
        "animation",
        "property: rotation; to: 0 360 0; dur: 7000; easing: linear; loop: true"
      );

      pauseButton.innerHTML = `
        <span class="control-icon" aria-hidden="true">Ⅱ</span>
        Pause Motion
      `;

      setStatus("Artefact motion resumed.");
    } else {
      heritageObject.removeAttribute("animation");

      pauseButton.innerHTML = `
        <span class="control-icon" aria-hidden="true">▶</span>
        Resume Motion
      `;

      setStatus("Artefact motion paused.");
    }

    isAnimationPaused = !isAnimationPaused;
  });

  infoButton.addEventListener("click", () => {
    infoPanel.hidden = false;
    setStatus("Artefact details opened.");
  });

  closeInfoButton.addEventListener("click", () => {
    infoPanel.hidden = true;

    if (isMarkerVisible) {
      setStatus("Continue exploring the Golden Stupa.");
    } else {
      setStatus("Point your camera at the HeritageLens Exhibit Marker.");
    }
  });
});