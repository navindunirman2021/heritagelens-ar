import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js";

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/GLTFLoader.js";

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
let placedArtefact = null;

let modelReady = false;
let modelLoadError = false;

let hitTestSource = null;
let hitTestSourceRequested = false;
let referenceSpace = null;

let surfaceFound = false;
let objectPlaced = false;

const INITIAL_LION_SCALE = 0.25;
const MIN_LION_SCALE = 0.12;
const MAX_LION_SCALE = 0.8;

function setMessage(message) {
  arMessage.textContent = message;
}

function setControlState() {
  placeButton.disabled = !surfaceFound || objectPlaced || !modelReady;
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
    const isSupported = await navigator.xr.isSessionSupported("immersive-ar");

    if (!isSupported) {
      startPanel.hidden = true;
      unsupportedPanel.hidden = false;
      return;
    }

    supportMessage.textContent =
      "Your device supports Space View. Find a flat surface, place the Heritage Lion, then rotate and resize it in your environment.";
  } catch (error) {
    console.error("Unable to check WebXR support:", error);
    startPanel.hidden = true;
    unsupportedPanel.hidden = false;
  }
}

function loadHeritageLion() {
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

      /*
        Starting scale and orientation.
        Adjust only these values if the Lion looks too large,
        too small, sideways, or backwards after Android testing.
      */
      lionModel.scale.set(
        INITIAL_LION_SCALE,
        INITIAL_LION_SCALE,
        INITIAL_LION_SCALE
      );

      lionModel.rotation.set(0, Math.PI, 0);

      modelReady = true;
      modelLoadError = false;

      setControlState();

      console.log("Heritage Lion GLB model loaded successfully.");
    },

    (progressEvent) => {
      if (!progressEvent.lengthComputable) {
        return;
      }

      const percentage = Math.round(
        (progressEvent.loaded / progressEvent.total) * 100
      );

      console.log(`Loading Heritage Lion: ${percentage}%`);
    },

    (error) => {
      modelReady = false;
      modelLoadError = true;

      console.error("Failed to load asset/models/Lion.glb:", error);

      setMessage(
        "The Heritage Lion could not be loaded. Please refresh and try again."
      );
    }
  );
}

function createReticle() {
  const geometry = new THREE.RingGeometry(0.075, 0.09, 32);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({
    color: 0xf3cd78,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });

  const result = new THREE.Mesh(geometry, material);

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

  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x26374d, 2.2);
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

  loadHeritageLion();

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

    if (modelReady) {
      setMessage("Move your device slowly to find a flat surface.");
    } else if (modelLoadError) {
      setMessage("The Heritage Lion could not be loaded. Please refresh.");
    } else {
      setMessage("Preparing Heritage Lion. Please wait...");
    }

    setControlState();
  } catch (error) {
    console.error("Unable to start Space View:", error);

    startARButton.disabled = false;
    startARButton.innerHTML =
      'Start Space View <span aria-hidden="true">→</span>';

    startPanel.hidden = true;
    unsupportedPanel.hidden = false;
  }
}

function onSessionEnd() {
  if (hitTestSource) {
    hitTestSource.cancel();
  }

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
  startARButton.innerHTML =
    'Start Space View <span aria-hidden="true">→</span>';

  setControlState();
}

function onSelect() {
  if (!surfaceFound || objectPlaced || !reticle.visible || !modelReady) {
    return;
  }

  placeArtefact();
}

function placeArtefact() {
  if (!modelReady || !lionModel) {
    setMessage("Preparing Heritage Lion. Please wait...");
    return;
  }

  placedArtefact = lionModel.clone(true);

  placedArtefact.position.setFromMatrixPosition(reticle.matrix);
  placedArtefact.quaternion.setFromRotationMatrix(reticle.matrix);

  /*
    Keep the lion upright after taking its orientation from the
    surface hit-test. If your model faces the wrong way, adjust
    lionModel.rotation above rather than changing this.
  */
  placedArtefact.rotation.x = 0;
  placedArtefact.rotation.z = 0;

  scene.add(placedArtefact);

  objectPlaced = true;
  reticle.visible = false;

  setMessage(
    "Heritage Lion placed. Use the controls to rotate, resize, or learn more."
  );

  infoButton.hidden = false;
  setControlState();
}

function rotateArtefact() {
  if (!placedArtefact) {
    return;
  }

  placedArtefact.rotation.y += Math.PI / 6;

  setMessage("Heritage Lion rotated by 30 degrees.");
}

function scaleArtefact(multiplier) {
  if (!placedArtefact) {
    return;
  }

  const currentScale = placedArtefact.scale.x;
  const nextScale = THREE.MathUtils.clamp(
    currentScale * multiplier,
    MIN_LION_SCALE,
    MAX_LION_SCALE
  );

  placedArtefact.scale.set(nextScale, nextScale, nextScale);

  setMessage(
    multiplier > 1
      ? "Heritage Lion enlarged."
      : "Heritage Lion reduced."
  );
}

function resetArtefact() {
  if (placedArtefact) {
    scene.remove(placedArtefact);
    placedArtefact = null;
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

  setControlState();
}

function render(timestamp, frame) {
  if (frame) {
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session
        .requestReferenceSpace("viewer")
        .then((viewerSpace) =>
          session.requestHitTestSource({ space: viewerSpace })
        )
        .then((source) => {
          hitTestSource = source;
        })
        .catch((error) => {
          console.error("Unable to create hit-test source:", error);
          setMessage("Surface tracking could not be started. Please restart.");
        });

      session
        .requestReferenceSpace("local")
        .then((space) => {
          referenceSpace = space;
        })
        .catch((error) => {
          console.error("Unable to create local reference space:", error);
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

            setMessage(
              modelReady
                ? "Surface found. Tap Place Lion."
                : "Surface found. Preparing Heritage Lion..."
            );

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
  if (surfaceFound && !objectPlaced && modelReady) {
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