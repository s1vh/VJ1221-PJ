# VJ1221-PJ — Armillary Sphere

> **VJ1221 project · Course 2015/16**  
> A GLSL/WebGL armillary sphere demo, restored and updated for modern browsers.

---

## ✨ About the project

This project started as my **VJ1221 Computer Graphics course project back in 2015/16**.

It is a small WebGL 1 demo built around a procedural armillary-sphere structure, reflective materials, nested transformations and a two-layer sky background. The original project has been preserved as a legacy version, while the current build has been carefully updated so it can still run reliably in modern browsers without losing its original character.

The background uses **two textured spheres with transparency** to create a subtle depth effect instead of looking like a single flat image.

---

## 🧭 Current demo

The current version includes a responsive fullscreen interface while keeping the armillary sphere as the main focus.

### Interface controls

- **Zoom** — smooth camera-distance control.
- **Rotation speed** — bidirectional slider centered at zero.
- **Orbits** — add or remove rings dynamically.
- **Play / Pause** — pause or resume the animation.
- **Materials** — browse the available materials in both directions.
- **Language** — automatic English/Spanish detection with manual switching.

The interface is responsive and designed to work without obscuring the model.

---

## 🖱️ Camera controls

The camera can be manipulated directly from the scene.

### Desktop

- **Drag** — rotate the camera.
- **SHIFT + drag** — zoom.
- **ALT + SHIFT + drag** — change perspective / FOV.

### Touch devices

- **One-finger drag** — rotate the camera.
- **Pinch gesture** — zoom.

Pointer events are used so mouse, touch and pen input share the same interaction system.

---

## ⌨️ Advanced keyboard controls

The original keyboard controls are still available for direct or advanced interaction.

| Control | Action |
|---|---|
| `P` | Play / pause |
| `M` | Next material |
| `↑` / `Numpad 8` | Increase odd-orbit speed |
| `↓` / `Numpad 2` | Decrease odd-orbit speed |
| `→` / `Numpad 6` | Increase even-orbit speed |
| `←` / `Numpad 4` | Decrease even-orbit speed |
| `Space` / `Numpad 5` | Manual step forward while paused |
| `Numpad 0` | Manual step backward while paused |
| `Numpad +` | Add orbit |
| `Numpad -` | Remove orbit |

> The old `C` shortcut, originally intended to switch between shaders for testing purposes, remains disabled in the final build.

---

## 🌌 Rendering notes

The project uses:

- WebGL 1 / GLSL shaders
- reflective materials
- dynamic orbit geometry
- nested transformation matrices
- two sphere maps for the background
- responsive canvas sizing with device-pixel-ratio support
- automatic WebGL context restoration
- asynchronous texture loading

The number of orbits can be changed dynamically while the application is running.

---

## 🔧 Restoration and browser compatibility

The original project was created more than a decade ago, and modern browser security policies are stricter than they were in 2015.

A few compatibility and reliability issues have therefore been fixed while preserving the original implementation as much as possible.

Among the changes:

- fixed a race condition in the original texture-loading code;
- added explicit shader compilation/linking diagnostics;
- corrected MIME handling for JavaScript files;
- made the canvas responsive;
- added high-DPI rendering support;
- avoided rebuilding torus buffers every frame;
- added WebGL context-loss/restoration handling;
- migrated camera input to Pointer Events;
- added the new responsive frontend while keeping the original page available as a legacy version.

---

## 🚀 Running locally

Because textures and browser security policies require the project to be served over HTTP, opening the HTML directly from the filesystem is not recommended.

A small Python development server is included under `scripts/`.

### Default launch

From the project root:

```bash
python scripts/localServer.py
```

This starts the server at:

```text
http://localhost:8000/
```

and automatically opens the **current version** in the default browser.

By default, HTTP request logs are kept quiet.

---

## 🛠️ Local server options

The server supports a few optional launch modes:

| Option | Short form | Behavior |
|---|---:|---|
| `/current` | `/c` | Open the current version at `/` |
| `/legacy` | `/l` | Open the original `astrolabio.html` version |
| `/none` | `/n` | Start the server without opening a browser |
| `/verbose` | `/v` | Show HTTP request logs in the terminal |
| `/help` | `/h`, `/?` | Show command-line help |

Options can be combined where appropriate.

Examples:

```bash
python scripts/localServer.py /legacy
```

```bash
python scripts/localServer.py /none /verbose
```

```bash
python scripts/localServer.py /?
```

The default behavior is equivalent to:

```bash
python scripts/localServer.py /current
```

---

## 🕰️ Legacy version

The original project page is intentionally preserved as:

```text
astrolabio.html
```

It remains available for historical comparison and to preserve the structure and behavior of the original university project.

The current public-facing version uses:

```text
index.html
```

---

## 📂 Project structure

```text
VJ1221-PJ/
├── index.html
├── astrolabio.html
├── astrolabio.js
├── interface.js
├── styles.css
├── gl-matrix-min.js
├── materiales.js
├── primitivas.js
├── maps/
└── scripts/
    └── localServer.py
```

---

## 📜 History

This repository is not intended as a rewrite of the old project.

The goal is to **restore, preserve and gradually modernize** a university project that originally worked in the browser ecosystem of 2015, keeping its unusual structure and visual identity while making it usable again today.

Legacy snapshots are kept separately so the original implementation remains available for comparison.

---

## 👤 Author

**s1vh**  
VJ1221 · Course 2015/16

Original project attribution:

```text
made by s1vh (al285854@uji.es)
```

---

*Built in 2015. Restored for modern browsers more than a decade later.*
