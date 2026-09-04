document.addEventListener("DOMContentLoaded", () => {
  const marker = document.getElementById("hiroMarker");
  const heritageObject = document.getElementById("heritageObject");
  const status = document.getElementById("arStatus");
  const scanGuide = document.getElementById("scanGuide");

  const rotateButton = document.getElementById("rotateButton");
  const guidedViewButton = document.getElementById("guidedViewButton");
  const infoButton = document.getElementById("infoButton");
  const closeInfoButton = document.getElementById("closeInfoButton");
  const infoPanel = document.getElementById("infoPanel");

  if (
    !marker ||
    !heritageObject ||
    !status ||
    !rotateButton ||
    !guidedViewButton ||
    !infoButton ||
    !closeInfoButton ||
    !infoPanel
  ) {
    console.error(
      "HeritageLens Exhibit Mode could not initialise because required page elements are missing."
    );
    return;
  }

  let isMarkerVisible = false;
  let guidedViewActive = false;
  let currentYRotation = 180;

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

  function getCurrentRotation() {
    const rotation = heritageObject.getAttribute("rotation");

    return {
      x: Number(rotation.x) || -90,
      y: Number(rotation.y) || currentYRotation,
      z: Number(rotation.z) || 0
    };
  }

  function updateGuidedViewButton(active) {
    if (active) {
      guidedViewButton.innerHTML = `
        <span class="control-icon" aria-hidden="true">Ⅱ</span>
        Stop Guided View
      `;
      return;
    }

    guidedViewButton.innerHTML = `
      <span class="control-icon" aria-hidden="true">◌</span>
      Guided View
    `;
  }

  function stopGuidedView() {
    heritageObject.removeAttribute("animation");
    guidedViewActive = false;
    updateGuidedViewButton(false);
  }

  marker.addEventListener("markerFound", () => {
    isMarkerVisible = true;
    hideScanGuide();

    setStatus(
      "Exhibit detected. Explore Nadungamuwa Vijaya Raja from different viewpoints."
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
    if (guidedViewActive) {
      stopGuidedView();
    }

    const rotation = getCurrentRotation();

    currentYRotation = (rotation.y + 30) % 360;

    heritageObject.setAttribute("animation__manualrotation", {
      property: "rotation",
      to: `${rotation.x} ${currentYRotation} ${rotation.z}`,
      dur: 450,
      easing: "easeOutQuad"
    });

    heritageObject.setAttribute("rotation", {
      x: rotation.x,
      y: currentYRotation,
      z: rotation.z
    });

    if (isMarkerVisible) {
      setStatus("Viewing Nadungamuwa Vijaya Raja from another angle.");
    } else {
      setStatus(
        "Your selected viewing angle is ready. Scan the Exhibit Marker to continue."
      );
    }
  });

  guidedViewButton.addEventListener("click", () => {
    if (guidedViewActive) {
      stopGuidedView();

      setStatus("Guided View stopped. Use View Another Angle to inspect the model.");
      return;
    }

    const rotation = getCurrentRotation();
    const guidedEndRotation = rotation.y + 90;

    currentYRotation = guidedEndRotation % 360;

    heritageObject.setAttribute("animation", {
      property: "rotation",
      from: `${rotation.x} ${rotation.y} ${rotation.z}`,
      to: `${rotation.x} ${guidedEndRotation} ${rotation.z}`,
      dur: 6500,
      easing: "easeInOutSine",
      loop: true,
      dir: "alternate"
    });

    guidedViewActive = true;
    updateGuidedViewButton(true);

    setStatus(
      "Guided View is active. The model is moving slowly through a 90-degree presentation angle."
    );
  });

  infoButton.addEventListener("click", () => {
    infoPanel.hidden = false;
    setStatus("Nadungamuwa Vijaya Raja exhibit details opened.");
  });

  closeInfoButton.addEventListener("click", () => {
    infoPanel.hidden = true;

    if (isMarkerVisible) {
      setStatus("Continue exploring Nadungamuwa Vijaya Raja.");
    } else {
      setStatus("Point your camera at the HeritageLens Exhibit Marker.");
    }
  });
});