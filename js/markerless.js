import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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

let lionModel = null;
let placedLion = null;

let modelReady = false;
let surfaceFound = false;
let objectPlaced = false;

let hitTestSource = null;
let hitTestReady = false;
let referenceSpace = null;

const INITIAL_SCALE = 0.25;
const MIN_SCALE = 0.12;
const MAX_SCALE = 0.80;

function setMessage(message) {
  arMessage.textContent = message;
}

function updateControls() {
  placeButton.disabled = !surfaceFound || objectPlaced || !modelReady;
  rotateButton.disabled = !objectPlaced;
  scaleUpButton.disabled = !objectPlaced;
  scaleDownButton.disabled = !objectPlaced;
  resetButton.disabled = !objectPlaced;
}

function showUnsupported() {
  startPanel.hidden = true;
  unsupportedPanel.hidden = false;
}

async function checkSupport() {
  if (!window.isSecureContext || !navigator.xr) {
    showUnsupported();
    return;
  }

  try {
    const supported = await navigator.xr.isSessionSupported("immersive-ar");

    if (!supported) {
      showUnsupported();
      return;
    }

    supportMessage.textContent =
      "Your device supports Space View. Find a flat surface, place the Heritage Lion, then rotate and resize it.";
  } catch (error) {
    console.error("WebXR support check failed:", error);
    showUnsupported();
  }
}

function loadLion() {
  const loader = new GLTFLoader();

  loader.load(
    "asset/models/Lion.glb",
    (gltf) => {
      lionModel = gltf.scene;

      lionModel.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material.needsUpdate = true;
        }
      });

      lionModel.scale.set(INITIAL_SCALE, INITIAL_SCALE, INITIAL_SCALE);
      lionModel.rotation.set(0, Math.PI, 0);

      modelReady = true;
      updateControls();

      console.log("Heritage Lion loaded.");
    },
    undefined,
    (error) => {
      modelReady = false;
      console.error("Unable to load asset/models/Lion.glb:", error);

      if (!arMessage.hidden) {
        setMessage("The Lion model could not load. Refresh the page and try again.");
      }
    }
  );
}

function createReticle() {
  const geometry = new THREE.RingGeometry(0.075, 0.10, 32);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color: 0xf3cd78,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;

  return mesh;
}

function initializeScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x243247, 2.2);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffe1a3, 2.2);
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

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", placeLionFromReticle);
  scene.add(controller);

  window.addEventListener("resize", onResize);

  loadLion();
}

async function startAR() {
  try {
    startARButton.disabled = true;
    startARButton.textContent = "Opening Space View…";

    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["local", "hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body }
    });

    renderer.xr.setReferenceSpaceType("local");
    await renderer.xr.setSession(session);

    session.addEventListener("end", endARSession);

    startPanel.hidden = true;
    unsupportedPanel.hidden = true;
    arMessage.hidden = false;
    arControls.hidden = false;

    setMessage(
      modelReady
        ? "Move your device slowly to find a flat surface."
        : "Loading Heritage Lion. Please wait..."
    );

    updateControls();
  } catch (error) {
    console.error("Unable to start immersive AR:", error);
    startARButton.disabled = false;
    startARButton.innerHTML = 'Start Space View <span aria-hidden="true">→</span>';

    showUnsupported();
  }
}

function endARSession() {
  if (hitTestSource) {
    hitTestSource.cancel();
  }

  hitTestSource = null;
  hitTestReady = false;
  referenceSpace = null;

  surfaceFound = false;
  objectPlaced = false;

  reticle.visible = false;

  if (placedLion) {
    scene.remove(placedLion);
    placedLion = null;
  }

  startPanel.hidden = false;
  arMessage.hidden = true;
  arControls.hidden = true;
  infoButton.hidden = true;
  artefactPanel.hidden = true;

  startARButton.disabled = false;
  startARButton.innerHTML = 'Start Space View <span aria-hidden="true">→</span>';

  updateControls();
}

function placeLionFromReticle() {
  if (!modelReady || !surfaceFound || objectPlaced || !reticle.visible) {
    return;
  }

  placeLion();
}

function placeLion() {
  if (!lionModel || !modelReady) {
    setMessage("Loading Heritage Lion. Please wait...");
    return;
  }

  placedLion = lionModel.clone(true);

  placedLion.position.setFromMatrixPosition(reticle.matrix);
  placedLion.quaternion.setFromRotationMatrix(reticle.matrix);

  placedLion.rotation.x = 0;
  placedLion.rotation.z = 0;

  scene.add(placedLion);

  objectPlaced = true;
  reticle.visible = false;

  setMessage("Heritage Lion placed. Rotate, resize, or view its details.");
  infoButton.hidden = false;

  updateControls();
}

function rotateLion() {
  if (!placedLion) {
    return;
  }

  placedLion.rotation.y += Math.PI / 6;
  setMessage("Heritage Lion rotated.");
}

function scaleLion(multiplier) {
  if (!placedLion) {
    return;
  }

  const nextScale = THREE.MathUtils.clamp(
    placedLion.scale.x * multiplier,
    MIN_SCALE,
    MAX_SCALE
  );

  placedLion.scale.set(nextScale, nextScale, nextScale);

  setMessage(multiplier > 1 ? "Heritage Lion enlarged." : "Heritage Lion reduced.");
}

function resetLion() {
  if (placedLion) {
    scene.remove(placedLion);
    placedLion = null;
  }

  objectPlaced = false;
  infoButton.hidden = true;
  artefactPanel.hidden = true;

  if (reticle.visible && modelReady) {
    surfaceFound = true;
    setMessage("Ready to place the Heritage Lion again.");
  } else {
    surfaceFound = false;
    setMessage("Move your device slowly to find a flat surface.");
  }

  updateControls();
}

function setupHitTest(session) {
  if (hitTestReady) {
    return;
  }

  session
    .requestReferenceSpace("viewer")
    .then((viewerSpace) => session.requestHitTestSource({ space: viewerSpace }))
    .then((source) => {
      hitTestSource = source;
    })
    .catch((error) => {
      console.error("Unable to create hit-test source:", error);
      setMessage("Surface tracking could not start. Exit and try again.");
    });

  session
    .requestReferenceSpace("local")
    .then((space) => {
      referenceSpace = space;
    })
    .catch((error) => {
      console.error("Unable to create local reference space:", error);
    });

  hitTestReady = true;
}

function render(timestamp, frame) {
  if (frame) {
    const session = renderer.xr.getSession();

    if (session) {
      setupHitTest(session);

      if (hitTestSource && referenceSpace && !objectPlaced) {
        const results = frame.getHitTestResults(hitTestSource);

        if (results.length > 0) {
          const pose = results[0].getPose(referenceSpace);

          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);

            if (!surfaceFound) {
              surfaceFound = true;

              setMessage(
                modelReady
                  ? "Surface found. Tap Place Lion."
                  : "Surface found. Loading Heritage Lion..."
              );

              updateControls();
            }
          }
        } else {
          reticle.visible = false;

          if (surfaceFound) {
            surfaceFound = false;
            setMessage("Searching for a flat surface...");
            updateControls();
          }
        }
      }
    }
  }

  renderer.render(scene, camera);
}

function onResize() {
  if (!camera || !renderer) {
    return;
  }

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

startARButton.addEventListener("click", startAR);

placeButton.addEventListener("click", () => {
  if (surfaceFound && modelReady && !objectPlaced) {
    placeLion();
  }
});

rotateButton.addEventListener("click", rotateLion);

scaleUpButton.addEventListener("click", () => {
  scaleLion(1.15);
});

scaleDownButton.addEventListener("click", () => {
  scaleLion(0.85);
});

resetButton.addEventListener("click", resetLion);

infoButton.addEventListener("click", () => {
  artefactPanel.hidden = false;
});

closeArtefactPanel.addEventListener("click", () => {
  artefactPanel.hidden = true;
});

initializeScene();
checkSupport();