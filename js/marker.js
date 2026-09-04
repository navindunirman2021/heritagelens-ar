document.addEventListener("DOMContentLoaded", () => {
  const marker = document.getElementById("hiroMarker");
  const elephant = document.getElementById("heritageObject");
  const status = document.getElementById("arStatus");
  const scanGuide = document.getElementById("scanGuide");

  const rotateButton = document.getElementById("rotateButton");
  const guidedViewButton = document.getElementById("guidedViewButton");
  const infoButton = document.getElementById("infoButton");
  const closeInfoButton = document.getElementById("closeInfoButton");
  const infoPanel = document.getElementById("infoPanel");

  if (
    !marker ||
    !elephant ||
    !status ||
    !rotateButton ||
    !guidedViewButton ||
    !infoButton ||
    !closeInfoButton ||
    !infoPanel
  ) {
    console.error("Exhibit Mode could not initialise. Required elements are missing.");
    return;
  }

  let markerVisible = false;
  let guidedViewActive = false;
  let currentYRotation = 180;

  function setStatus(message) {
    status.textContent = message;
  }

  function setGuideVisible(visible) {
    if (scanGuide) {
      scanGuide.hidden = !visible;
    }
  }

  function getRotation() {
    const rotation = elephant.getAttribute("rotation");

    return {
      x: Number(rotation.x) || -90,
      y: Number(rotation.y) || currentYRotation,
      z: Number(rotation.z) || 0
    };
  }

  function setGuidedButton(active) {
    guidedViewButton.innerHTML = active
      ? '<span aria-hidden="true">Ⅱ</span><span>Stop view</span>'
      : '<span aria-hidden="true">◌</span><span>Guided view</span>';
  }

  function stopGuidedView() {
    elephant.removeAttribute("animation");
    guidedViewActive = false;
    setGuidedButton(false);
  }

  marker.addEventListener("markerFound", () => {
    markerVisible = true;
    setGuideVisible(false);
    setStatus("Exhibit detected. Explore Nadungamuwa Vijaya Raja.");
  });

  marker.addEventListener("markerLost", () => {
    markerVisible = false;
    setGuideVisible(true);
    setStatus("Marker not visible. Centre the Exhibit Marker in your camera view.");
  });

  rotateButton.addEventListener("click", () => {
    if (guidedViewActive) {
      stopGuidedView();
    }

    const rotation = getRotation();
    currentYRotation = (rotation.y + 30) % 360;

    elephant.setAttribute("animation__manual", {
      property: "rotation",
      from: `${rotation.x} ${rotation.y} ${rotation.z}`,
      to: `${rotation.x} ${currentYRotation} ${rotation.z}`,
      dur: 380,
      easing: "easeOutQuad"
    });

    elephant.setAttribute("rotation", {
      x: rotation.x,
      y: currentYRotation,
      z: rotation.z
    });

    setStatus(
      markerVisible
        ? "Viewing the exhibit from another angle."
        : "Angle selected. Scan the marker to continue."
    );
  });

  guidedViewButton.addEventListener("click", () => {
    if (guidedViewActive) {
      stopGuidedView();
      setStatus("Guided view stopped.");
      return;
    }

    const rotation = getRotation();
    const endRotation = rotation.y + 80;

    elephant.setAttribute("animation", {
      property: "rotation",
      from: `${rotation.x} ${rotation.y} ${rotation.z}`,
      to: `${rotation.x} ${endRotation} ${rotation.z}`,
      dur: 6000,
      easing: "easeInOutSine",
      loop: true,
      dir: "alternate"
    });

    guidedViewActive = true;
    setGuidedButton(true);

    setStatus("Guided view active. The exhibit is moving slowly through a viewing range.");
  });

  infoButton.addEventListener("click", () => {
    infoPanel.hidden = false;
    setStatus("Exhibit details opened.");
  });

  closeInfoButton.addEventListener("click", () => {
    infoPanel.hidden = true;

    setStatus(
      markerVisible
        ? "Continue exploring Nadungamuwa Vijaya Raja."
        : "Point your camera at the HeritageLens Exhibit Marker."
    );
  });
});