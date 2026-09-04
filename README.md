# HeritageLens

HeritageLens is a browser-based augmented reality platform that helps visitors explore digital heritage objects through mobile devices. It provides two complementary AR experiences:

- **Exhibit Mode**: Marker-based AR using a Hiro marker to reveal an interactive elephant exhibit.
- **Space View**: Markerless WebXR AR that allows a visitor to place, rotate, resize, and explore a digital lion on a real-world surface.

The project is designed as a lightweight, mobile-first cultural heritage experience that runs in a browser without requiring a native mobile application.

---

## Live Application

- **Hosted URL:** https://heritagelens-ar.netlify.app
- **Source Repository:** [Add your GitHub repository URL here]

> Use the latest Google Chrome on an AR-capable Android device for the complete Space View experience.

---

## Project Features

### Exhibit Mode — Marker-Based AR

Exhibit Mode uses A-Frame and AR.js marker tracking.

- Uses the predefined **Hiro marker** for detection.
- Displays an optimized Elephant GLB model.
- Presents a digital interpretive exhibit inspired by **Nadungamuwa Vijaya Raja**.
- Includes a museum-style AR title plaque.
- Allows the visitor to select a different viewing angle.
- Provides a Guided View motion mode.
- Displays an information panel with cultural context.
- Includes real-time marker detected / marker lost feedback.
- Runs on supported mobile browsers with camera access.

### Space View — Markerless WebXR AR

Space View uses Three.js and the WebXR Device API.

- Checks whether the device supports `immersive-ar`.
- Uses WebXR hit-testing to detect real-world surfaces.
- Displays a placement reticle when a valid surface is found.
- Loads an optimized Lion GLB model.
- Allows the visitor to place the lion in their physical environment.
- Provides Rotate, Scale Up, Scale Down, Reset, and Information interactions.
- Uses a multi-step interaction flow:

```text
Start Space View
→ Scan a surface
→ Detect surface
→ Place Lion
→ Rotate / Scale / View information
→ Reset and place again
```

- Includes a fallback screen for unsupported devices and browsers.

---

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Marker-based AR | A-Frame and AR.js |
| Markerless AR | Three.js and WebXR Device API |
| 3D model loading | Three.js GLTFLoader |
| 3D asset format | GLB / glTF 2.0 |
| Hosting | Netlify |
| Source control | Git and GitHub |

---

## Project Structure

```text
heritagelens-ar/
│
├── index.html
├── marker.html
├── markerless.html
├── style.css
├── README.md
├── ASSET_ATTRIBUTION.md
│
├── js/
│   ├── marker.js
│   └── markerless.js
│
├── asset/
│   └── models/
│       ├── Elephant.glb
│       └── Lion.glb
│
└── screenshots/
```

### Key Files

| File | Purpose |
|---|---|
| `index.html` | HeritageLens landing page and navigation |
| `marker.html` | Marker-based Exhibit Mode page |
| `markerless.html` | Markerless WebXR Space View page |
| `js/marker.js` | Elephant exhibit interaction logic |
| `js/markerless.js` | WebXR hit-test, reticle, Lion placement, and controls |
| `style.css` | Responsive user interface and AR overlay styling |
| `asset/models/Elephant.glb` | 3D Elephant model used in Exhibit Mode |
| `asset/models/Lion.glb` | 3D Lion model used in Space View |
| `ASSET_ATTRIBUTION.md` | Model, library, and platform acknowledgements |

---

## Local Setup

No build tool or backend server is required.

### Prerequisites

- Git
- A modern web browser
- Visual Studio Code recommended
- VS Code Live Server extension recommended
- Android Chrome and an AR-capable Android device for full markerless WebXR testing

### Run locally with Live Server

1. Clone the repository:

```bash
git clone [YOUR_GITHUB_REPOSITORY_URL]
```

2. Enter the project directory:

```bash
cd heritagelens-ar
```

3. Open the folder in Visual Studio Code:

```bash
code .
```

4. Install the **Live Server** extension in VS Code.

5. Right-click `index.html`.

6. Select:

```text
Open with Live Server
```

7. Open the local address in your browser, for example:

```text
http://127.0.0.1:5500/index.html
```

> Do not open HTML files directly using `file://`. Camera and WebXR features require a local development server or an HTTPS deployment.

---

## How to Use

### Exhibit Mode

1. Open the HeritageLens landing page.
2. Select **Explore an Exhibit**.
3. Allow camera access.
4. Display or print a Hiro marker on a separate screen or paper.
5. Point the phone camera at the Hiro marker.
6. Wait for the Elephant exhibit and title plaque to appear.
7. Use:
   - **View Angle** to rotate the Elephant.
   - **Guided View** to start or stop slow presentation movement.
   - **Discover** to read exhibit information.

### Space View

1. Open the HeritageLens landing page.
2. Select **Try Space View**.
3. Use Google Chrome on an AR-capable Android phone.
4. Select **Start Space View**.
5. Allow camera access.
6. Move the phone slowly above a well-lit, textured table or floor.
7. Wait until the placement reticle appears.
8. Select **Place Lion**.
9. Use:
   - **Rotate** to change orientation.
   - **Scale +** to enlarge the Lion.
   - **Scale −** to reduce the Lion.
   - **Reset** to remove and place the Lion again.
   - **Info** to read information about the model.

---

## Browser and Device Support

| Device / Browser | Exhibit Mode | Space View |
|---|---:|---:|
| Android Chrome on AR-capable device | Supported | Supported |
| Android Chrome on non-AR-capable device | May support marker tracking | Shows compatibility fallback |
| iPhone Safari | Supported for marker tracking where camera access is available | Not supported; compatibility fallback shown |
| Desktop Chrome / Edge | Useful for landing-page testing and development | Usually shows compatibility fallback |

### Important limitation

Markerless WebXR AR depends on hardware and browser support. Space View requires:

- A secure HTTPS origin.
- Google Chrome on Android.
- An AR-capable device.
- Google Play Services for AR / ARCore where required.
- Camera permission.
- A well-lit, textured physical surface for hit-testing.

If Space View is unavailable, HeritageLens directs visitors to Exhibit Mode.

---

## Testing Summary

The project was tested through the Netlify HTTPS deployment and local development server.

| Test ID | Device / Browser | Test Scenario | Expected Result |
|---|---|---|---|
| T01 | Laptop browser | Open landing page | Responsive page and navigation links work |
| T02 | iPhone Safari | Open Exhibit Mode | Camera permission and marker-based AR available |
| T03 | iPhone Safari | Open Space View | Compatibility fallback is shown |
| T04 | Android Chrome | Open Exhibit Mode | Hiro marker detects Elephant exhibit |
| T05 | Android Chrome | Start Space View | WebXR AR session starts on supported device |
| T06 | Android Chrome | Scan a flat surface | Reticle appears after hit-test detection |
| T07 | Android Chrome | Place Lion | Lion is positioned on detected surface |
| T08 | Android Chrome | Use controls | Rotate, scale, reset, and information controls work |
| T09 | Netlify HTTPS deployment | Load GLB models | Elephant and Lion models load without missing-asset errors |

> Replace or extend the testing outcomes in your technical report using your actual device results and screenshots.

---

## 3D Assets and Optimisation

HeritageLens uses lightweight GLB models selected for browser and mobile AR delivery.

| Asset | File | Size | Used In |
|---|---|---:|---|
| Elephant | `asset/models/Elephant.glb` | Approximately 1.0 MB | Exhibit Mode |
| Lion | `asset/models/Lion.glb` | Approximately 1.9 MB | Space View |

The models were selected in GLB format to package 3D geometry, materials, and textures efficiently for browser delivery. Their compact file sizes reduce download time and help improve mobile AR performance.

For full asset source and licence information, see:

```text
ASSET_ATTRIBUTION.md
```

---

## Accessibility and User Experience

The application uses several UX considerations:

- Clear primary actions on the landing page.
- Mobile-responsive layouts.
- Large touch-friendly AR controls.
- Status messages for marker detection, surface detection, loading, placement, and reset actions.
- Disabled controls until a valid interaction state is reached.
- A visible unsupported-device fallback for WebXR limitations.
- Clear Exit/Home actions in both AR modes.
- Separate Exhibit Mode and Space View journeys to avoid confusion between marker-based and markerless AR.

---

## Known Limitations

- Space View is dependent on Android Chrome and AR-compatible device hardware.
- iPhone Safari does not provide general WebXR `immersive-ar` support for this implementation.
- Marker detection quality can be affected by low light, glare, an incomplete marker border, motion blur, or a very small marker.
- Surface detection may take time on plain, reflective, very dark, or poorly lit surfaces.
- The current 3D assets are low-poly digital interpretive models rather than exact scanned replicas of physical museum artefacts.

---

## Future Improvements

Possible future enhancements include:

- Custom HeritageLens image markers rather than the standard Hiro marker.
- Additional cultural artefacts and themed collections.
- Sinhala, Tamil, and English language support.
- Audio narration and ambient sound.
- Exhibit-specific historical timelines.
- User analytics for measuring exhibit engagement.
- Apple AR Quick Look support using USDZ models for iPhone users.
- Improved model compression through Draco geometry compression and KTX2 texture compression.
- Accessibility improvements, including captions, screen-reader-focused content, and reduced-motion settings.

---

## Academic Context

This project was developed as an individual implementation for:

```text
INTE 42312 — Virtual and Augmented Reality
```

The public HeritageLens interface is intentionally presented as a visitor-focused digital heritage prototype. Technical implementation details, testing evidence, asset acknowledgement, and reflection are documented in the accompanying technical report.

---

## Licence and Acknowledgements

This project uses openly licensed libraries and third-party 3D assets. Asset creator, source, and licence details are listed in:

```text
ASSET_ATTRIBUTION.md
```

Key technology acknowledgements:

- A-Frame
- AR.js
- Three.js
- WebXR Device API
- GLTFLoader
- Netlify