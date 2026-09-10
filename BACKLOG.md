# VJ1221-PJ — BACKLOG

> Pending work for the restored and modernized **Armillary Sphere** project.
>
> This backlog focuses only on features that are still intentionally unfinished after the first public-facing modernization pass.

---

## Current baseline

The project is already in a publishable state.

Completed modernization work includes:

- restored compatibility with modern browsers;
- asynchronous texture loading;
- shader compile/link diagnostics;
- MIME-safe local development server;
- responsive canvas sizing;
- device-pixel-ratio support;
- optimized orbit torus buffers;
- WebGL context loss/restoration handling;
- semantic control helper functions;
- responsive glassmorphism frontend;
- English/Spanish GUI;
- material browsing controls;
- global orbit speed control;
- zoom control;
- dynamic orbit count controls;
- play/pause UI;
- mouse/touch/pen camera control through Pointer Events;
- preserved advanced keyboard controls;
- legacy `astrolabio.html` kept for historical comparison;
- `localServer.py` with current / legacy / none / verbose / help modes;
- updated README for the restored project.

The tasks below are therefore **enhancements**, not blockers for publication.

---

# 1. Advanced GUI mode

## Goal

Add an optional advanced interface mode without making the default GUI more complex.

The normal interface should remain minimal and focused on the most obvious controls.

The advanced mode should expose parameters that are currently only available through keyboard modifiers or direct internal state.

---

## 1.1 Advanced-mode toggle

Add a discreet control that enables or disables the advanced GUI.

Possible UI patterns:

- small `Advanced` pill/button;
- compact gear/settings icon;
- collapsible secondary glass panel.

The advanced controls should not be visible by default.

### Acceptance criteria

- Default GUI remains visually simple.
- Advanced controls can be shown and hidden without affecting the WebGL state.
- Switching modes does not reset camera, orbit speed, material or playback state.

---

## 1.2 FOV control

Expose `fovy` through the advanced GUI.

Current advanced desktop behavior:

```text
ALT + SHIFT + drag
→ change field of view
```

Suggested GUI representation:

```text
Perspective / FOV
[ slider ]
```

The slider should use the same safe limits already enforced by the engine:

```text
1.0 <= fovy <= 3.13
```

Do not remove the existing advanced pointer/keyboard interaction.

### Acceptance criteria

- Slider and direct camera interaction remain synchronized.
- Changing FOV while paused redraws immediately.
- No values can exceed the existing safe range.
- Perspective changes remain numerically stable.

---

## 1.3 Independent odd/even orbit speed controls

The current GUI intentionally exposes one global orbit-speed slider.

Advanced mode may optionally expose:

```text
Odd family speed
Even family speed
```

This should reuse the existing `a` and `b` behavior.

The normal global slider should remain available and, when moved, synchronize both families again.

### Suggested behavior

```text
global slider moved
→ a = value
→ b = value

advanced odd slider moved
→ a changes only

advanced even slider moved
→ b changes only
```

If `a != b`, the normal GUI may continue to show the current `Mixed / Mixta` state.

### Acceptance criteria

- Advanced controls preserve the existing family behavior.
- Global and advanced controls do not fight each other.
- Keyboard controls still work.
- GUI state remains synchronized after keyboard changes.

---

## 1.4 Optional camera reset

Consider adding an advanced reset control for:

```text
myphi
zeta
radius
fovy
```

This should restore the initial camera state without modifying the armillary sphere itself.

Suggested initial values:

```js
myphi = 0;
zeta = 0;
radius = 2;
fovy = Math.PI / 2.4;
```

This is optional but useful once more camera parameters become visible.

---

# 2. Orbit color picking

## Goal

Allow users to directly interact with orbit families by clicking/tapping the rings.

Do not use analytical torus raycasting.

The selected strategy is a hidden **color-picking render pass**.

The interaction unit is the orbit **family**, not an individual orbit.

---

## 2.1 Picking categories

Use a minimal color map:

```text
BLACK → no orbit
RED   → odd orbit family
GREEN → even orbit family
```

Exact RGB values are implementation details.

Do not assign a unique color ID per orbit unless a future feature explicitly requires individual orbit selection.

---

## 2.2 Offscreen picking pass

Create an offscreen framebuffer used only when selection is required.

Suggested flow:

```text
pointerdown
    ↓
render picking pass
    ↓
read pixel under pointer
    ↓
detect:
    none / odd / even
```

Use `gl.readPixels()` to read the selected pixel.

The picking pass must never flash on the visible canvas.

### Acceptance criteria

- Visible rendering is unaffected.
- Odd/even family detection works regardless of camera orientation.
- Clicking empty background returns no selection.
- Picking remains stable with different orbit counts.

---

## 2.3 Larger invisible hit area

Visible toruses are thin.

Picking geometry should optionally be slightly thicker than visual geometry.

Concept:

```text
visible orbit   → thin torus
picking orbit   → slightly thicker torus
```

This improves usability without modifying the visible model.

### Acceptance criteria

- Orbit selection feels forgiving.
- Nearby empty space is not selected excessively.
- Dense crossing regions remain usable.

---

## 2.4 Family highlighting

When a family is hovered, selected or dragged, visually highlight all members of that family.

Possible strategies:

- subtle material tint;
- temporary brightness increase;
- emissive-looking shader adjustment;
- secondary lightweight pass.

The effect should remain elegant and should not destroy the reflective material appearance.

### UX goal

Make the internal odd/even grouping visible to the user:

```text
select one odd orbit
→ all odd orbits highlight
```

and similarly for even orbits.

### Acceptance criteria

- Highlight clearly communicates the selected family.
- Highlight does not permanently modify the selected material.
- Highlight disappears correctly when interaction ends.

---

## 2.5 Direct family dragging

After successful picking:

```text
pointerdown on orbit
    ↓
family selected
    ↓
pointer drag
    ↓
modify aa or bb
```

Dragging empty space should continue rotating the camera.

Suggested interaction priority:

```text
pointerdown
│
├─ orbit detected
│      ↓
│   orbit-family drag mode
│
└─ no orbit detected
       ↓
    camera drag mode
```

Start with a simple screen-space mapping before attempting more physical manipulation.

Possible first mapping:

```text
horizontal pointer delta
→ angular change
```

### Acceptance criteria

- Orbit drag and camera drag never happen simultaneously.
- Odd/even family behavior remains preserved.
- Selection is released on `pointerup` and `pointercancel`.
- Interaction works with mouse, touch and pen.
- Transition between camera and orbit interaction does not get stuck.

---

# 3. Background depth improvement

## Goal

Make the two existing sky layers create a more perceptible sense of depth.

Current structure:

```text
outer sphere → stars
inner sphere → nebula
```

The chosen strategy is **fixed angular parallax**, not moving the sphere closer/farther.

---

## 3.1 Fixed angular parallax

Apply a subtle differential rotation between the outer and inner background layers.

Preferred approach:

```text
outer background
→ normal camera-relative orientation

inner background
→ slightly different angular response
```

Possible implementation models:

### Option A — rotation factor

```text
inner rotation = camera rotation × factor
```

Example conceptual values:

```text
outer = 1.00
inner = 0.96
```

### Option B — small derived angular offset

Apply a small additional offset based on camera movement.

---

## 3.2 Keep parallax fixed

Do not expose parallax strength in the normal GUI.

The effect should be tuned as part of the project art direction.

Reason:

- keeps interface simple;
- avoids settings that reveal the spherical geometry;
- makes the background effect intentional rather than technical.

A later advanced GUI could expose this only if testing proves useful.

---

## 3.3 Inner background opacity

Add a simple frontend control for the nebula contribution.

Suggested range:

```text
0.0 → invisible
1.0 → full/default intensity
```

Possible label:

```text
Nebula intensity
```

or:

```text
Nebula opacity
```

The outer star background must remain unaffected.

### Acceptance criteria

- Opacity updates smoothly.
- Changes work while playing and paused.
- Default value reproduces the intended appearance.
- No geometry regeneration is required.

---

# 4. Alternative background image loading

## Goal

Allow users to replace the default inner and outer sky images at runtime.

The feature should work entirely in-browser.

No server upload is required.

---

## 4.1 Separate inner and outer uploads

Provide controls for:

```text
Inner background
Outer background
```

The inner layer is intended as the translucent / atmospheric layer.

The outer layer is intended as the opaque environment.

---

## 4.2 Browser-side image pipeline

Suggested flow:

```text
File input
    ↓
Image / createImageBitmap
    ↓
temporary 2D canvas
    ↓
normalize aspect / size
    ↓
power-of-two texture
    ↓
WebGL upload
```

The processed image should remain local to the user session.

---

## 4.3 Normalize to equirectangular 2:1

Use a standard 2:1 panoramic texture shape.

Suggested output sizes:

```text
512 × 256
1024 × 512
2048 × 1024
```

Choose an appropriate resolution according to the source image and GPU limits.

---

## 4.4 Fit strategy

Initial implementation may support only:

```text
Cover
```

Meaning:

- fill the complete 2:1 texture;
- crop excess source image;
- avoid empty bands.

A later version may optionally support:

```text
Fit
```

to preserve the entire image.

---

## 4.5 Alpha / transparency support

Current texture upload uses RGB.

Custom inner backgrounds should support RGBA when the uploaded image contains alpha.

Recommended behavior:

```text
outer background
→ opaque

inner background
→ alpha-aware / opacity-controlled
```

Do not attempt automatic background removal in the first version.

### Acceptance criteria

- PNG/WebP transparency can be preserved for the inner layer.
- Existing RGB textures continue working.
- The nebula-opacity control affects uploaded inner backgrounds too.

---

## 4.6 Reset to defaults

Provide controls to restore:

```text
default inner background
default outer background
```

without reloading the entire application.

The default texture URLs should remain the project assets:

```text
maps/eve_sky.png
maps/starlight_sky.png
```

---

# 5. Frontend refinements after new features

These tasks should happen after the advanced controls, picking and custom backgrounds are working.

---

## 5.1 UI grouping

Reorganize the interface around:

```text
Primary controls
Advanced controls
Background controls
```

Avoid adding controls simply because internal variables exist.

---

## 5.2 Selection feedback

Possible additions:

- odd/even family indicator;
- subtle selected-family label;
- small legend only while interacting.

Do not permanently occupy screen space unless useful.

---

## 5.3 Background upload feedback

Possible additions:

- image name;
- small thumbnail preview;
- reset button;
- invalid-format message;
- image-processing status.

---

## 5.4 Fullscreen mode

Consider a dedicated fullscreen button for presentations and portfolio use.

Use the browser Fullscreen API rather than resizing the page manually.

---

## 5.5 Help / control reference

Consider a compact help overlay containing:

- pointer gestures;
- keyboard shortcuts;
- advanced controls.

This should remain hidden by default.

---

# 6. Optional engine / cleanup tasks

These are lower-priority improvements.

---

## 6.1 RequestAnimationFrame coalescing while paused

Rapid UI/keyboard input may schedule multiple single frames while paused.

Consider tracking whether a paused redraw is already scheduled.

Example concept:

```text
redraw already pending?
    yes → do nothing
    no  → request frame
```

Only optimize if profiling or testing shows value.

---

## 6.2 Angle normalization

Current animation normalizes positive values above 360.

Consider normalizing negative angles as well.

Example:

```js
aa = ((aa % 360) + 360) % 360;
bb = ((bb % 360) + 360) % 360;
```

Do not change legacy behavior without testing.

---

## 6.3 Revisit unused primitive data

Check whether the high-resolution `myTorus` generated in `initPrimitives()` is still used.

If it is dead code in the current build, either:

- remove it from the modern branch;
- or keep it intentionally with a comment explaining its legacy purpose.

---

## 6.4 Shader-switch restoration

The original project contained multiple shading modes.

If shader switching is restored:

- re-enable the relevant UI/keyboard control;
- preserve current material;
- preserve lighting state;
- ensure textures/reflection state remain correct;
- test context restoration after shader changes.

This remains optional.

---

# 7. Suggested implementation order

Recommended order after the first public release:

```text
1. Advanced GUI shell
2. FOV control
3. Optional odd/even advanced speed controls
4. Background angular parallax
5. Inner background opacity
6. Color-picking framebuffer
7. Odd/even picking detection
8. Family highlighting
9. Direct orbit-family dragging
10. Custom background upload
11. RGBA support for inner backgrounds
12. Background reset controls
13. Frontend polish
14. Optional engine cleanup
```

---

# 8. Release strategy

None of these features need to block the initial public version.

Recommended workflow:

```text
main
  ↑
 dev
  ↑
feature/*
```

Suggested branches:

```text
feature/advanced-gui
feature/background-parallax
feature/orbit-picking
feature/custom-backgrounds
feature/ui-polish
```

Merge completed features into `dev`, test them there, then promote stable milestones to `main`.

---

# 9. Core principles to preserve

## Preserve the historical project

This is a restoration and modernization effort, not a rewrite.

The original geometry, transformation structure and visual identity are part of the project's value.

## Keep the default GUI simple

Advanced capability should not make the main experience harder to understand.

## Reuse semantic engine actions

The frontend should call shared functions rather than manipulate internal variables directly whenever practical.

## Preserve advanced direct controls

GUI features should supplement keyboard and pointer interaction, not unnecessarily remove them.

## Keep orbit families intentional

Odd/even orbit grouping is part of the structure of the original project and should remain visible in the interaction model.

## Prefer tuned visual behavior over technical sliders

If a parameter is primarily part of the art direction—such as parallax strength—prefer a good fixed value unless user control genuinely improves the experience.

## Keep the project fork-friendly

A developer opening the repository years later should be able to understand why each subsystem exists and how the legacy and modernized versions relate.
