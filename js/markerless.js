import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";

const startPanel = document.getElementById("startPanel");
const unsupportedPanel = document.getElementById("unsupportedPanel");
const supportMessage = document.getElementById("supportMessage");
const startARButton = document.getElementById("startARButton");

const arMessage = document.getElementById("arMessage");
const arControls = document.getElementById("arControls");

const placeButton = document.getElementById("placeButton");
const rotateButton = document.getElementById("rotateButton");
const scaleUpButton = document.getElementById("scaleUpButton");
const scaleDownButton = document.getElementById("scaleDownButton");
const resetButton = document.getElementById("resetButton");

const artefactPanel = document.getElementById("artefactPanel");
const infoButton = document.getElementById("infoButton");
const closeArtefactPanel = document.getElementById("closeArtefactPanel");

let scene;
let camera;
let renderer;
let controller;
let reticle;
let artefact;
let placedArtefact = null;

let hitTestSource = null;
let hitTestSourceRequested = false;
let referenceSpace = null;

let surfaceFound = false;
let objectPlaced = false;

function setMessage(message) {
  arMessage.textContent = message;
}

function setControlState() {
  placeButton.disabled = !surfaceFound || objectPlaced;
  rotateButton.disabled = !objectPlaced;
  scaleUpButton.disabled = !objectPlaced;
  scaleDownButton.disabled = !objectPlaced;
  resetButton.disabled = !objectPlaced;
}

async function checkWebXRSupport() {
  if (!navigator.xr) {
    startPanel.hidden = true;
    unsupportedPanel.hidden = false;
    return;
  }

  try {
    const supported = await navigator.xr.isSessionSupported("immersive-ar");

    if (!supported) {
      startPanel.hidden = true;
      unsupportedPanel.hidden = false;
      return;
    }

    supportMessage.textContent =
      "Your device supports Space View. Move around a flat surface, place a digital artefact, then rotate, resize, and explore it in context.";
  } catch (error) {
    startPanel.hidden = true;
    unsupportedPanel.hidden = false;
  }
}

function createCeremonialMask() {
  const group = new THREE.Group();

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a12b,
    metalness: 0.28,
    roughness: 0.5
  });

  const darkGoldMaterial = new THREE.MeshStandardMaterial({
    color: 0x82480d,
    metalness: 0.18,
    roughness: 0.58
  });

  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a1f2d,
    metalness: 0.08,
    roughness: 0.6
  });

  const ivoryMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2dfb5,
    metalness: 0.05,
    roughness: 0.72
  });

  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x17120f,
    metalness: 0.08,
    roughness: 0.45
  });

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 32, 24),
    goldMaterial
  );
  face.scale.set(0.85, 1.2, 0.28);
  face.position.y = 0.2;
  group.add(face);

  const forehead = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 28, 20),
    darkGoldMaterial
  );
  forehead.scale.set(0.9, 1.05, 0.25);
  forehead.position.set(0, 0.31, 0.045);
  group.add(forehead);

  const leftEyeSocket = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 20, 16),
    blackMaterial
  );
  leftEyeSocket.scale.set(1.35, 0.75, 0.35);
  leftEyeSocket.position.set(-0.065, 0.225, 0.14);
  group.add(leftEyeSocket);

  const rightEyeSocket = leftEyeSocket.clone();
  rightEyeSocket.position.x = 0.065;
  group.add(rightEyeSocket);

  const leftEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 16, 12),
    ivoryMaterial
  );
  leftEye.position.set(-0.065, 0.225, 0.16);
  group.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.x = 0.065;
  group.add(rightEye);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, 0.12, 4),
    goldMaterial
  );
  nose.position.set(0, 0.18, 0.15);
  nose.rotation.x = Math.PI / 2;
  group.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.008, 12, 24, Math.PI),
    redMaterial
  );
  mouth.position.set(0, 0.12, 0.155);
  mouth.rotation.x = Math.PI;
  group.add(mouth);

  const leftHorn = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.22, 18),
    ivoryMaterial
  );
  leftHorn.position.set(-0.14, 0.38, 0);
  leftHorn.rotation.z = -0.55;
  group.add(leftHorn);

  const rightHorn = leftHorn.clone();
  rightHorn.position.x = 0.14;
  rightHorn.rotation.z = 0.55;
  group.add(rightHorn);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.18, 5),
    redMaterial
  );
  crown.position.set(0, 0.48, 0);
  group.add(crown);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.05, 32),
    darkGoldMaterial
  );
  base.position.y = 0.02;
  group.add(base);

  group.scale.set(1.2, 1.2, 1.2);
  group.rotation.y = Math.PI;

  return group;
}

function createReticle() {
  const reticleGeometry = new THREE.RingGeometry(0.075, 0.09, 32);
  reticleGeometry.rotateX(-Math.PI / 2);

  const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0xf3cd78,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });

  const result = new THREE.Mesh(reticleGeometry, reticleMaterial);
  result.matrixAutoUpdate = false;
  result.visible = false;

  return result;
}

function initializeScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x243247, 2.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffe0a1, 2.4);
  directionalLight.position.set(1, 2, 1);
  scene.add(directionalLight);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.setAnimationLoop(render);

  document.body.appendChild(renderer.domElement);

  reticle = createReticle();
  scene.add(reticle);

  artefact = createCeremonialMask();

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  window.addEventListener("resize", onWindowResize);
}

async function startAR() {
  try {
    startARButton.disabled = true;
    startARButton.textContent = "Opening Space View...";

    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["local", "hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body }
    });

    startPanel.hidden = true;
    arMessage.hidden = false;
    arControls.hidden = false;

    renderer.xr.setReferenceSpaceType("local");
    await renderer.xr.setSession(session);

    session.addEventListener("end", onSessionEnd);

    setMessage("Move your device slowly to find a flat surface.");
    setControlState();
  } catch (error) {
    startARButton.disabled = false;
    startARButton.textContent = "Start Space View";
    startPanel.hidden = true;
    unsupportedPanel.hidden = false;

    console.error("Unable to start immersive AR:", error);
  }
}

function onSessionEnd() {
  hitTestSourceRequested = false;
  hitTestSource = null;
  referenceSpace = null;

  surfaceFound = false;
  objectPlaced = false;

  reticle.visible = false;

  if (placedArtefact) {
    scene.remove(placedArtefact);
    placedArtefact = null;
  }

  startPanel.hidden = false;
  arMessage.hidden = true;
  arControls.hidden = true;
  infoButton.hidden = true;
  artefactPanel.hidden = true;

  startARButton.disabled = false;
  startARButton.innerHTML = 'Start Space View <span aria-hidden="true">→</span>';
}

function onSelect() {
  if (!surfaceFound || objectPlaced || !reticle.visible) {
    return;
  }

  placeArtefact();
}

function placeArtefact() {
  placedArtefact = artefact.clone(true);

  placedArtefact.position.setFromMatrixPosition(reticle.matrix);
  placedArtefact.quaternion.setFromRotationMatrix(reticle.matrix);

  placedArtefact.rotation.x = 0;
  placedArtefact.rotation.z = 0;

  scene.add(placedArtefact);

  objectPlaced = true;
  reticle.visible = false;

  setMessage("Artefact placed. Use the controls to explore it.");
  infoButton.hidden = false;
  setControlState();
}

function rotateArtefact() {
  if (!placedArtefact) {
    return;
  }

  placedArtefact.rotation.y += Math.PI / 4;
  setMessage("Artefact rotated.");
}

function scaleArtefact(multiplier) {
  if (!placedArtefact) {
    return;
  }

  const currentScale = placedArtefact.scale.x;
  const nextScale = THREE.MathUtils.clamp(currentScale * multiplier, 0.45, 2.2);

  placedArtefact.scale.set(nextScale, nextScale, nextScale);

  setMessage(multiplier > 1 ? "Artefact enlarged." : "Artefact reduced.");
}

function resetArtefact() {
  if (placedArtefact) {
    scene.remove(placedArtefact);
    placedArtefact = null;
  }

  objectPlaced = false;
  surfaceFound = reticle.visible;

  infoButton.hidden = true;
  artefactPanel.hidden = true;

  setMessage(
    surfaceFound
      ? "Ready to place again. Select Place Artefact."
      : "Move your device slowly to find a flat surface."
  );

  setControlState();
}

function render(timestamp, frame) {
  if (frame) {
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace("viewer").then((viewerSpace) => {
        session.requestHitTestSource({ space: viewerSpace }).then((source) => {
          hitTestSource = source;
        });
      });

      session.requestReferenceSpace("local").then((space) => {
        referenceSpace = space;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource && referenceSpace && !objectPlaced) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);

          if (!surfaceFound) {
            surfaceFound = true;
            setMessage("Surface found. Tap Place Artefact.");
            setControlState();
          }
        }
      } else {
        reticle.visible = false;

        if (surfaceFound) {
          surfaceFound = false;
          setMessage("Searching for a flat surface...");
          setControlState();
        }
      }
    }
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  if (!camera || !renderer) {
    return;
  }

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

startARButton.addEventListener("click", startAR);

placeButton.addEventListener("click", () => {
  if (surfaceFound && !objectPlaced) {
    placeArtefact();
  }
});

rotateButton.addEventListener("click", rotateArtefact);

scaleUpButton.addEventListener("click", () => {
  scaleArtefact(1.15);
});

scaleDownButton.addEventListener("click", () => {
  scaleArtefact(0.85);
});

resetButton.addEventListener("click", resetArtefact);

infoButton.addEventListener("click", () => {
  artefactPanel.hidden = false;
});

closeArtefactPanel.addEventListener("click", () => {
  artefactPanel.hidden = true;
});

initializeScene();
checkWebXRSupport();