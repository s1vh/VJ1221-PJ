/* -------------------------------------------------------------------------
   VJ1221-PJ preliminary frontend
   Keeps UI logic separate from the WebGL engine in astrolabio.js.
   ------------------------------------------------------------------------- */

(function () {
    "use strict";

    /* ---------------------------------------------------------------------
       TUNING CONSTANTS

       The sliders expose normalized UI positions. These constants determine
       how those positions map to the effective engine values.

       SPEED_MAX:
       Effective +/- speed represented by the two slider ends. Keyboard
       controls can still push a/b beyond this value; the thumb will simply
       remain clamped to the corresponding end until the slider is moved.

       SPEED_CURVE:
       Higher values make the centered speed slider increasingly gentle near
       zero and increasingly aggressive near the ends.

       ZOOM_*_RADIUS:
       The GUI zoom range. Existing direct camera controls can still move
       beyond ZOOM_FAR_RADIUS; the slider will then remain at its far end.
       --------------------------------------------------------------------- */

    var SPEED_MAX = 6.0;
    var SPEED_CURVE = 3.0;

    var ZOOM_NEAR_RADIUS = 1.1;
    var ZOOM_FAR_RADIUS = 5.0;

    var SPEED_EPSILON = 0.0001;

    var translations = {
        en: {
            title: "Armillary Sphere",
            cameraHint: "Drag to rotate",
            material: "Material",
            zoom: "Zoom",
            rotation: "Rotation",
            orbits: "Orbits",
            pause: "Pause",
            resume: "Resume",
            mixed: "Mixed"
        },
        es: {
            title: "Esfera Armillar",
            cameraHint: "Arrastra para rotar",
            material: "Material",
            zoom: "Zoom",
            rotation: "Rotación",
            orbits: "Órbitas",
            pause: "Pausa",
            resume: "Reanudar",
            mixed: "Mixta"
        }
    };

    var materialLabels = {
        en: [
            "Brass",
            "Bronze",
            "Polished Bronze",
            "Chrome",
            "Copper",
            "Polished Copper",
            "Gold",
            "Polished Gold",
            "Tin",
            "Silver",
            "Polished Silver",
            "Emerald",
            "Jade",
            "Obsidian",
            "Pearl",
            "Ruby",
            "Turquoise"
        ],
        es: [
            "Latón",
            "Bronce",
            "Bronce pulido",
            "Cromo",
            "Cobre",
            "Cobre pulido",
            "Oro",
            "Oro pulido",
            "Estaño",
            "Plata",
            "Plata pulida",
            "Esmeralda",
            "Jade",
            "Obsidiana",
            "Perla",
            "Rubí",
            "Turquesa"
        ]
    };

    var elements = {};
    var language = getInitialLanguage();
    var cameraHintDismissed = false;
    var cameraDragStart = null;
    var syncFramePending = false;

    function getInitialLanguage() {
        var stored = localStorage.getItem("armillary-language");

        if (stored === "es" || stored === "en") {
            return stored;
        }

        return (navigator.language || "").toLowerCase().startsWith("es")
            ? "es"
            : "en";
    }

    function t(key) {
        return translations[language][key] || key;
    }

    function applyLanguage() {
        document.documentElement.lang = language;

        document.querySelectorAll("[data-i18n]").forEach(function (element) {
            var key = element.getAttribute("data-i18n");

            if (translations[language][key]) {
                element.textContent = translations[language][key];
            }
        });

        /* The button displays the language the user can switch TO. */
        elements.languageToggle.textContent = language === "en" ? "ES" : "EN";

        updateMaterialLabel();
        updatePlaybackUI();
        updateAccessibleLabels();
    }

    function updateAccessibleLabels() {
        elements.materialPrevious.setAttribute(
            "aria-label",
            language === "es" ? "Material anterior" : "Previous material"
        );

        elements.materialNext.setAttribute(
            "aria-label",
            language === "es" ? "Material siguiente" : "Next material"
        );

        elements.orbitRemove.setAttribute(
            "aria-label",
            language === "es" ? "Quitar órbita" : "Remove orbit"
        );

        elements.orbitAdd.setAttribute(
            "aria-label",
            language === "es" ? "Añadir órbita" : "Add orbit"
        );

        elements.zoomSlider.setAttribute(
            "aria-label",
            language === "es" ? "Zoom" : "Zoom"
        );

        elements.speedSlider.setAttribute(
            "aria-label",
            language === "es" ? "Velocidad de rotación" : "Orbit rotation speed"
        );
    }

    /* ---------------------------------------------------------------------
       SPEED MAPPING
       Slider position: -100 ... +100
       Effective speed: -SPEED_MAX ... +SPEED_MAX

       The exponential mapping is symmetric around zero.
       --------------------------------------------------------------------- */

    function speedFromSliderPosition(position) {
        var normalized = Number(position) / 100;

        if (Math.abs(normalized) < SPEED_EPSILON) {
            return 0;
        }

        var direction = normalized < 0 ? -1 : 1;
        var magnitude = Math.abs(normalized);
        var exponential =
            (Math.exp(SPEED_CURVE * magnitude) - 1) /
            (Math.exp(SPEED_CURVE) - 1);

        return direction * SPEED_MAX * exponential;
    }

    function sliderPositionFromSpeed(speed) {
        var clamped = Math.max(-SPEED_MAX, Math.min(SPEED_MAX, speed));

        if (Math.abs(clamped) < SPEED_EPSILON) {
            return 0;
        }

        var direction = clamped < 0 ? -1 : 1;
        var normalizedMagnitude = Math.abs(clamped) / SPEED_MAX;
        var magnitude =
            Math.log(
                1 +
                normalizedMagnitude *
                (Math.exp(SPEED_CURVE) - 1)
            ) / SPEED_CURVE;

        return direction * magnitude * 100;
    }

    /* ---------------------------------------------------------------------
       ZOOM MAPPING
       Slider position: 0 ... 100 (far ... near)

       Radius is interpolated geometrically instead of linearly. This gives
       the control finer movement near the useful close-camera region while
       still allowing the far end to cover a much larger distance.
       --------------------------------------------------------------------- */

    function radiusFromZoomPosition(position) {
        var normalized = Math.max(0, Math.min(100, Number(position))) / 100;
        var ratio = ZOOM_FAR_RADIUS / ZOOM_NEAR_RADIUS;

        return ZOOM_FAR_RADIUS / Math.pow(ratio, normalized);
    }

    function zoomPositionFromRadius(currentRadius) {
        var clamped = Math.max(
            ZOOM_NEAR_RADIUS,
            Math.min(ZOOM_FAR_RADIUS, currentRadius)
        );

        var ratio = ZOOM_FAR_RADIUS / ZOOM_NEAR_RADIUS;

        return (
            Math.log(ZOOM_FAR_RADIUS / clamped) /
            Math.log(ratio)
        ) * 100;
    }

    function getDisplayedGlobalSpeed() {
        /*
         * The advanced keyboard controls can deliberately make odd/even
         * families diverge. The single GUI slider represents their global
         * average in that state. Moving the slider makes both equal again.
         */
        return (Number(a) + Number(b)) / 2;
    }

    function speedFamiliesAreMixed() {
        return Math.abs(Number(a) - Number(b)) > SPEED_EPSILON;
    }

    function formatSpeed(speed) {
        if (Math.abs(speed) < 0.05) {
            return "0";
        }

        var sign = speed > 0 ? "+" : "";
        return sign + speed.toFixed(1);
    }

    function updateMaterialLabel() {
        if (!elements.materialName) {
            return;
        }

        var labels = materialLabels[language] || materialLabels.en;
        var label = labels[materialIndex] || ("#" + (materialIndex + 1));
        elements.materialName.textContent = label;
    }

    function updatePlaybackUI() {
        if (!elements.playPause) {
            return;
        }

        elements.playPause.setAttribute("aria-pressed", play ? "false" : "true");
        elements.playPauseIcon.textContent = play ? "Ⅱ" : "▶";
        elements.playPauseText.textContent = play ? t("pause") : t("resume");
    }

    function updateSpeedUI() {
        var globalSpeed = getDisplayedGlobalSpeed();
        var position = sliderPositionFromSpeed(globalSpeed);

        elements.speedSlider.value = String(position);

        if (speedFamiliesAreMixed()) {
            elements.speedValue.textContent = t("mixed");
            elements.speedValue.title =
                "Odd: " + Number(a).toFixed(1) +
                " / Even: " + Number(b).toFixed(1);
        } else {
            elements.speedValue.textContent = formatSpeed(globalSpeed);
            elements.speedValue.removeAttribute("title");
        }
    }

    function updateZoomUI() {
        var position = zoomPositionFromRadius(Number(radius));
        elements.zoomSlider.value = String(position);
        elements.zoomValue.textContent = String(Math.round(position));
    }

    function updateOrbitUI() {
        elements.orbitCount.textContent = String(orbs);
        elements.orbitRemove.disabled = Number(orbs) <= 1;
    }

    function syncFromEngine() {
        syncFramePending = false;

        updateMaterialLabel();
        updatePlaybackUI();
        updateSpeedUI();
        updateZoomUI();
        updateOrbitUI();
    }

    function scheduleSyncFromEngine() {
        if (syncFramePending) {
            return;
        }

        syncFramePending = true;
        requestAnimationFrame(syncFromEngine);
    }

    function announce(message) {
        elements.statusMessage.textContent = "";
        requestAnimationFrame(function () {
            elements.statusMessage.textContent = message;
        });
    }

    function engineFunctionAvailable(name) {
        if (typeof window[name] === "function") {
            return true;
        }

        console.warn(
            "Armillary Sphere UI: astrolabio.js is missing " +
            name +
            "(). Add the proposed semantic helper before using this control."
        );

        return false;
    }

    function dismissCameraHint() {
        if (cameraHintDismissed) {
            return;
        }

        cameraHintDismissed = true;
        elements.cameraHint.classList.add("is-dismissed");
    }

    function bindControls() {
        elements.languageToggle.addEventListener("click", function () {
            language = language === "en" ? "es" : "en";
            localStorage.setItem("armillary-language", language);
            applyLanguage();
            scheduleSyncFromEngine();
        });

        elements.materialPrevious.addEventListener("click", function () {
            changeMaterial(-1);
            scheduleSyncFromEngine();
        });

        elements.materialNext.addEventListener("click", function () {
            changeMaterial(1);
            scheduleSyncFromEngine();
        });

        elements.orbitRemove.addEventListener("click", function () {
            subtractOrbits();
            scheduleSyncFromEngine();
        });

        elements.orbitAdd.addEventListener("click", function () {
            increaseOrbits();
            scheduleSyncFromEngine();
        });

        elements.playPause.addEventListener("click", function () {
            pause();
            scheduleSyncFromEngine();
        });

        elements.speedSlider.addEventListener("input", function (event) {
            if (!engineFunctionAvailable("setOrbitSpeed")) {
                return;
            }

            var speed = speedFromSliderPosition(event.target.value);
            setOrbitSpeed(speed);
            scheduleSyncFromEngine();
        });

        elements.zoomSlider.addEventListener("input", function (event) {
            if (!engineFunctionAvailable("setZoom")) {
                return;
            }

            var desiredRadius = radiusFromZoomPosition(event.target.value);
            setZoom(desiredRadius);
            scheduleSyncFromEngine();
        });

        /*
         * astrolabio.js remains the owner of keyboard behavior. This listener
         * only refreshes the GUI after its handler has changed engine state.
         */
        document.addEventListener("keydown", scheduleSyncFromEngine, false);

        /*
         * Camera drag and Shift-drag zoom remain implemented in astrolabio.js.
         * These listeners only keep the GUI synchronized and dismiss the hint
         * after a real camera drag has been discovered by the user.
         */
        elements.canvas.addEventListener("pointerdown", function (event) {
            cameraDragStart = {
                x: event.clientX,
                y: event.clientY
            };
        });

        elements.canvas.addEventListener("pointermove", function (event) {
            if (cameraDragStart) {
                var dx = event.clientX - cameraDragStart.x;
                var dy = event.clientY - cameraDragStart.y;

                if ((dx * dx + dy * dy) > 36) {
                    dismissCameraHint();
                }
            }
            scheduleSyncFromEngine();
        });
		
		function endCameraPointer() {
			cameraDragStart = null;
			scheduleSyncFromEngine();
		}
		
		elements.canvas.addEventListener(
			"pointerup",
			endCameraPointer
		);
		
		elements.canvas.addEventListener(
			"pointercancel",
			endCameraPointer
		);

        /*window.addEventListener("mouseup", function () {
            cameraDragStart = null;
            scheduleSyncFromEngine();
        });

        window.addEventListener("blur", function () {
            cameraDragStart = null;
        });*/
    }

    function cacheElements() {
        elements.canvas = document.getElementById("myCanvas");
        elements.cameraHint = document.getElementById("cameraHint");
        elements.languageToggle = document.getElementById("languageToggle");

        elements.materialPrevious = document.getElementById("materialPrevious");
        elements.materialNext = document.getElementById("materialNext");
        elements.materialName = document.getElementById("materialName");

        elements.zoomSlider = document.getElementById("zoomSlider");
        elements.zoomValue = document.getElementById("zoomValue");

        elements.speedSlider = document.getElementById("speedSlider");
        elements.speedValue = document.getElementById("speedValue");

        elements.orbitRemove = document.getElementById("orbitRemove");
        elements.orbitAdd = document.getElementById("orbitAdd");
        elements.orbitCount = document.getElementById("orbitCount");

        elements.playPause = document.getElementById("playPause");
        elements.playPauseIcon = document.getElementById("playPauseIcon");
        elements.playPauseText = document.getElementById("playPauseText");

        elements.statusMessage = document.getElementById("statusMessage");
    }

    function initInterface() {
        cacheElements();
        applyLanguage();
        bindControls();
        syncFromEngine();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initInterface);
    } else {
        initInterface();
    }
})();
