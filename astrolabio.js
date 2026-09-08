
var gl, program;
var myTorus;
var orbitTorusArray = [];

var orbs = 4;	// I want to be able to change the number of orbits

var  a	 = 1;	// odd orbit angle increment
var  b	 = 1;   // pair orbit angle increment
var aa	 = 0;   // odd orbit angle
var bb	 = 0;   // pair orbit angle

var play = true;
var contextLost = false;	// prevents to request new frames if WebGL context has been lost

var myphi = 0, zeta = 0, radius = 2, fovy = Math.PI/2.4;

var materials = [
	Brass,
	Bronze,
	Polished_bronze,
	Chrome,
	Copper,
	Polished_copper,
	Gold,
	Polished_gold,
	Tin,
	Silver,
	Polished_silver,
	Esmerald,
	Jade,
	Obsidian,
	Perl,
	Ruby,
	Turquoise
];

var materialIndex = materials.indexOf(Chrome);	// starting material ("Chrome" for the legacy version)
var mat = materials[materialIndex];

var shadingMode	= 0;

var innerBackground;
var outerBackground;

// Gets the canvas and tries the available WebGL context names in order, returning the first valid context found or null if WebGL is not available.
function getWebGLContext() {
    
	var canvas = document.getElementById("myCanvas");
    
	var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    
	for (var i = 0; i < names.length; ++i) {
		
		var context = canvas.getContext(names[i]);
		if (context) { return context; }
	}
  
	return null;

}

// Creates, compiles and links the active vertex and fragment shaders, binds every attribute and uniform used by the renderer, and throws a useful error if compilation or linking fails.
function initShaders()	{ 
    
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	switch(shadingMode)	{
		
		case 0:
		
			gl.shaderSource(vertexShader, document.getElementById("reflectionVertexShader").text);
			gl.shaderSource(fragmentShader, document.getElementById("reflectionFragmentShader").text);
			
			break;
			
		case 1:
		
			gl.shaderSource(vertexShader, document.getElementById("GouraudVertexShader").text);
			gl.shaderSource(fragmentShader, document.getElementById("GouraudFragmentShader").text);
			
			break;
			
		case 2:
		
			gl.shaderSource(vertexShader, document.getElementById("PhongVertexShader").text);
			gl.shaderSource(fragmentShader, document.getElementById("PhongFragmentShader").text);
			
			break;
			
	}
		
	gl.compileShader(vertexShader);
	gl.compileShader(fragmentShader);
	
	program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	
	gl.linkProgram(program);
	gl.useProgram(program);
	
	program.vertexPositionAttribute = gl.getAttribLocation( program, "VertexPosition");
	gl.enableVertexAttribArray(program.vertexPositionAttribute);
	
	program.modelViewMatrixIndex  = gl.getUniformLocation( program, "modelViewMatrix");
	program.projectionMatrixIndex = gl.getUniformLocation( program, "projectionMatrix");
	
	// normals
	program.vertexNormalAttribute = gl.getAttribLocation ( program, "VertexNormal");
	program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
	gl.enableVertexAttribArray(program.vertexNormalAttribute);
	
	// texture coords
	program.vertexTexcoordsAttribute = gl.getAttribLocation ( program, "VertexTexcoords");
	gl.enableVertexAttribArray(program.vertexTexcoordsAttribute);
	
	// bind control parameters
	program.reflectionIndex		= gl.getUniformLocation( program, "reflection");
	program.depthIndex			= gl.getUniformLocation( program, "depth");
	
	// material
	program.KaIndex               = gl.getUniformLocation( program, "Material.Ka");
	program.KdIndex               = gl.getUniformLocation( program, "Material.Kd");
	program.KsIndex               = gl.getUniformLocation( program, "Material.Ks");
	program.alphaIndex            = gl.getUniformLocation( program, "Material.alpha");
	
	// light source
	program.LaIndex               = gl.getUniformLocation( program, "Light.La");
	program.LdIndex               = gl.getUniformLocation( program, "Light.Ld");
	program.LsIndex               = gl.getUniformLocation( program, "Light.Ls");
	program.PositionIndex         = gl.getUniformLocation( program, "Light.Position");
	
	// check shaders (this will help me with tracing the issue in case I get stuck for another eleven years... )
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vertexShader));
		throw new Error(
            "Vertex shader:\n" +
            gl.getShaderInfoLog(vertexShader)
		);
	}

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(fragmentShader));
		throw new Error(
            "Fragment shader:\n" +
            gl.getShaderInfoLog(fragmentShader)
        );
	}

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		throw new Error(
            "Shader program:\n" +
            gl.getProgramInfoLog(program)
        );
	}
	
}

// Sets the basic WebGL rendering state for this build: black clear color, depth testing, blending mode and the initial light values used by the active shader.
function initRendering()	{
	
	gl.clearColor(0.0,0.0,0.0,1.0);
	gl.enable(gl.DEPTH_TEST);
	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_DST_COLOR);
	
	setShaderLight();
	
}

// Creates and uploads the vertex and index buffers for a model so its geometry can be reused by WebGL without rebuilding it every frame.
function initBuffers(model)	{
	
	model.idBufferVertices = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
	
	model.idBufferIndices = gl.createBuffer ();
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
	gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
	
}

// Initializes the reusable base primitives required by this build: the shared cylinder, sphere and high-resolution torus.
function initPrimitives()	{
	
	// I only need these three primitives for this build
	initBuffers(exampleCylinder);
	initBuffers(exampleSphere);
	
	myTorus = makeTorus(0.5, 1, 100, 100);
	initBuffers(myTorus);
	
}

// Sends the current projection matrix to the active shader program.
function setShaderProjectionMatrix(projectionMatrix)	{
	
	gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
	
}

// Sends the current model-view matrix to the active shader program.
function setShaderModelViewMatrix(modelViewMatrix)	{
	
	gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
	
}

// Sends the normal matrix to the active shader so normals remain correct after the model-view transformations.
function setShaderNormalMatrix(normalMatrix)	{
	
	gl.uniformMatrix3fv(program.normalMatrixIndex, false, normalMatrix);
	
}

// Builds the normal matrix from a model-view matrix by extracting its 3x3 part, inverting it and transposing it before returning the result.
function getNormalMatrix(modelViewMatrix)	{
	
	var normalMatrix = mat3.create();
	
	mat3.fromMat4  (normalMatrix, modelViewMatrix);
	mat3.invert    (normalMatrix, normalMatrix);
	mat3.transpose (normalMatrix, normalMatrix);
	
	return normalMatrix;
	
}

// Builds the perspective projection matrix using the current field of view and the real canvas aspect ratio, so the scene keeps its proportions after a resize.
function getProjectionMatrix()	{
	
	var projectionMatrix  = mat4.create();
	var aspect = gl.canvas.width / gl.canvas.height;
	
	mat4.perspective(projectionMatrix, fovy, aspect, 0.1, 100.0);
	
	return projectionMatrix;
	
}

// Keeps the WebGL drawing buffer synchronized with the canvas CSS size and the device pixel ratio, updates the viewport, and returns whether the canvas size actually changed.
function resizeCanvas() {
	
	var canvas = gl.canvas;
	var dpr = window.devicePixelRatio || 1;

	var width = Math.round(canvas.clientWidth * dpr);
	var height = Math.round(canvas.clientHeight * dpr);
	
	var resized = canvas.width !== width || canvas.height !== height;

	if (resized) {
		canvas.width = width;
		canvas.height = height;
		//console.log("Canvas resized:", canvas.clientWidth, "x", canvas.clientHeight, "CSS →", width, "x", height, "WebGL", "aspect:", width / height);
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	
	return resized;
}

// Builds the camera view matrix from the current spherical camera angles and radius, always looking at the center of the astrolabe.
function getCameraMatrix()	{
	
	var _phi  = myphi* Math.PI / 180.0;
	var _zeta = zeta * Math.PI / 180.0;
	
	var x = 0, y = 0, z = 0;
	z = radius * Math.cos(_zeta) * Math.cos(_phi);
	x = radius * Math.cos(_zeta) * Math.sin(_phi);
	y = radius * Math.sin(_zeta);
	
	var cameraMatrix = mat4.create();
	mat4.lookAt(cameraMatrix, [x, y, z], [0, 0, 0], [0, 1, 0]);
	
	return cameraMatrix;
	
}

// Builds the background camera matrix using the same orientation as the main camera but a logarithmic radius, creating the zoom effect without allowing the camera to leave the sky sphere.
function getStaticCameraMatrix()	{
	
	var _phi  = myphi * Math.PI / 180.0;
	var _zeta = zeta  * Math.PI / 180.0;
	
	var x = 0, y = 0, z = 0;
	z = Math.log(radius) * Math.cos(_zeta) * Math.cos(_phi);
	x = Math.log(radius) * Math.cos(_zeta) * Math.sin(_phi);
	y = Math.log(radius) * Math.sin(_zeta);
	// I use a logarithmic relation so I create some zoom effect without leaving the sky orb
	
	var cameraMatrix = mat4.create();
	mat4.lookAt(cameraMatrix, [x, y, z], [0, 0, 0], [0, 1, 0]);
	
	return cameraMatrix;
	
}

// Sends the selected material ambient, diffuse, specular and shininess values to the active shader.
function setShaderMaterial(material)	{
	
	gl.uniform3fv(program.KaIndex,    material.mat_ambient);
	gl.uniform3fv(program.KdIndex,    material.mat_diffuse);
	gl.uniform3fv(program.KsIndex,    material.mat_specular);
	gl.uniform1f (program.alphaIndex, material.alpha);
	
}

// Sends the current light color and position to the active shader. The values are still fixed here, so this function will need to preserve user-selected lighting if shader switching is restored later.
function setShaderLight()	{	// this must be modified to allow current colors to be saved after changing shaders
	
	gl.uniform3f(program.LaIndex,       1.0,1.0,1.0);
	gl.uniform3f(program.LdIndex,       1.0,1.0,1.0);
	gl.uniform3f(program.LsIndex,       1.0,1.0,1.0);
	gl.uniform3f(program.PositionIndex, 10.0,10.0,0.0); // en coordenadas del ojo
	
}

// Loads an image from a URL and returns a Promise that resolves only when the image is ready, preventing WebGL from trying to build a texture before its source has finished loading.
function loadImage(url) {
    return new Promise(function(resolve, reject) {
        var image = new Image();

        image.onload = function() {
            resolve(image);
        };

        image.onerror = function() {
            reject(new Error("No se pudo cargar " + url));
        };

        image.src = url;
    });
}

// Creates a WebGL texture from an already loaded image, assigns it to the requested texture unit and shader sampler, configures filtering and wrapping, generates mipmaps and returns the texture reference.
function setTexture(tag, image, unit) {
    var texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);

	// set maps are always power of 2 so I don't need to check it here (otherwise normalize under this line)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	// texture data
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        image
    );

	// filtering parameters
    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
    );

	// repetition/mosaic parameters (for texture coords > 1)
    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.MIRRORED_REPEAT
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.MIRRORED_REPEAT
    );

	// mipmap generation
    gl.generateMipmap(gl.TEXTURE_2D);

	// the texture object is assigned to the active unit
    var location = gl.getUniformLocation(
        program,
        tag
    );

    gl.uniform1i(location, unit);

	// returning the texture reference
    return texture;
}

// Binds a model's vertex and index buffers, describes the packed position/normal/texture-coordinate layout to the shader and draws the indexed triangles.
function drawSolid(model)	{
	
	gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
	gl.vertexAttribPointer (program.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
	gl.vertexAttribPointer (program.vertexNormalAttribute,    3, gl.FLOAT, false, 8*4, 3*4);
	gl.vertexAttribPointer (program.vertexTexcoordsAttribute, 2, gl.FLOAT, false, 8*4, 6*4);
	gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
	gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
	
}

// Draws a regular scene model by combining its model matrix with the movable camera, calculating the normal and projection matrices, applying its material and rendering it without blending.
function drawModel(modelMatrix, primitive, material) {
	
	var modelViewMatrix = mat4.create();
	mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
	setShaderModelViewMatrix(modelViewMatrix);
	
	var normalMatrix = mat3.create();
	normalMatrix = getNormalMatrix(modelViewMatrix);
	setShaderNormalMatrix(normalMatrix);
	
	var projectionMatrix  = mat4.create();
	projectionMatrix = getProjectionMatrix();
	setShaderProjectionMatrix(projectionMatrix);
	
	setShaderMaterial(material);
	
	gl.disable(gl.BLEND);	// disables transparency
	drawSolid(primitive);
	
}

// Draws a sky/background model with the static camera matrix so camera rotation and zoom affect the view without making the background behave like a normal object in the scene.
function drawBackground(modelMatrix, primitive, material) {
	
	var modelViewMatrix = mat4.create();
	mat4.multiply(modelViewMatrix, getStaticCameraMatrix(), modelMatrix);
	setShaderModelViewMatrix(modelViewMatrix);
	
	var normalMatrix = mat3.create();
	normalMatrix = getNormalMatrix(modelViewMatrix);
	setShaderNormalMatrix(normalMatrix);
	
	var projectionMatrix  = mat4.create();
	projectionMatrix = getProjectionMatrix();
	setShaderProjectionMatrix(projectionMatrix);
	
	setShaderMaterial(material);
	
	gl.enable(gl.BLEND);	// enables transparency
	drawSolid(primitive);
	
}

// Applies the chained X and Z rotations that give each nested orbit its alternating +/-45 degree orientation while propagating the odd and even orbit angles through the structure.
function rotateOrbit(modelMatrix, rotations, alfa, beta)  {

	for (var i = 0; i < rotations; i=i+2) {

		mat4.rotateX(modelMatrix, modelMatrix, Math.getRadians(beta));

		if (i%2 != 0) {
			
			mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(-45));
			
		} else {
			
			mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(45));
			
		}

		if (i+1 < rotations ||  i%2 != 0)  {

			mat4.rotateX(modelMatrix, modelMatrix, Math.getRadians(alfa));
			mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(-45));

		} else if (i+1 < rotations) {

			mat4.rotateX(modelMatrix, modelMatrix, Math.getRadians(alfa));
			mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(45));

		}

	}

}

// Deletes the GPU vertex and index buffers currently owned by the dynamically generated orbit toruses before they are replaced.
function deleteTorusBuffers() {
	
	for (var i = 0; i < orbitTorusArray.length; i++) {
		gl.deleteBuffer(orbitTorusArray[i].idBufferVertices);
		gl.deleteBuffer(orbitTorusArray[i].idBufferIndices);
	}
}

// Recreates the orbit torus geometry and GPU buffers for the current number of orbits, storing one torus per orbit in orbitTorusArray.
function createTorusBuffers() {
	
	orbitTorusArray = [];
	for (var i = 1; i <= orbs; i++) {
		var orbitTorus = makeTorus(0.02 * i, 0.8 * i, 6, 48);
		initBuffers(orbitTorus);
		orbitTorusArray.push(orbitTorus);
	}
}

// Rebuilds the dynamic orbit buffers safely by deleting the current GPU buffers first and then creating a fresh set for the current orbit count.
function rebuildTorusBuffers() {
	deleteTorusBuffers();
	createTorusBuffers();
}

// Renders one complete frame: aborts if the WebGL context is lost, keeps the canvas responsive, draws both sky layers and every astrolabe orbit/orb/handler, then advances the animation and requests the next frame only while playback is active.
function drawScene() {
	
	if (contextLost) { return; }	// returns and does nothing if the WebGL context has been lost in the previous frame

	resizeCanvas();
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var modelMatrix = mat4.create();
	
	//	SKY
	gl.uniform1i(program.reflectionIndex, false);	// disables reflection at the shader
	
	// outer sky sphere
	gl.uniform1i(program.depthIndex, 2);			// sets object depth
	
	mat4.identity(modelMatrix);
	mat4.scale(modelMatrix, modelMatrix, [90, 90, 90]);
	drawBackground(modelMatrix, exampleSphere, Background);			// Background is a neutral mat for rendering skies
	
	// inner sky sphere
	gl.uniform1i(program.depthIndex, 1);			// sets object depth
	
	mat4.identity(modelMatrix);
	mat4.scale(modelMatrix, modelMatrix, [40, 40, 40]);
	mat4.rotateX(modelMatrix, modelMatrix, Math.getRadians(180));	// I want it to start showing the opposite side
	drawBackground(modelMatrix, exampleSphere, Background);			// Background is a neutral mat for rendering skies

    //	OBJECT
	gl.uniform1i(program.reflectionIndex, true);	// enables reflection at the shader
	gl.uniform1i(program.depthIndex, 0);			// sets object depth
	
	mat4.identity(modelMatrix);
	
	//	ORBITS
	for (var i = 1; i <= orbs; i++)  {
				
		mat4.identity(modelMatrix);
		
		// --rotation begins here--
		mat4.rotateX(modelMatrix, modelMatrix, Math.getRadians(aa));
		mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(45));
		rotateOrbit(modelMatrix, orbs-i, aa, bb);
		// --rotation  ends  here--
		
		var rotationMatrix = mat4.clone(modelMatrix);
		
		mat4.scale(modelMatrix, modelMatrix, [1/orbs, 1/orbs, 1/i]); // normalize orbits
		drawModel(modelMatrix, orbitTorusArray[i-1], mat);
		
		// ORBS
		mat4.copy(modelMatrix, rotationMatrix);
		
		if ((orbs-i)%2 == 0)	{
			
			mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(-90));	// --odds--
			
		}	else	{
			
			mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(45));	// --pairs-
			
		}
		mat4.translate(modelMatrix, modelMatrix, [i*0.4*2/orbs, 0, 0]);
		mat4.scale(modelMatrix, modelMatrix, [1/orbs/3, 1/orbs/3, 1/orbs/3]);
		
		drawModel(modelMatrix, exampleSphere, mat);
		
		// HANDLERS
		for (var j = -1; j < 2; j=j+2)  { // --two handlers for each orbit--
			
			if (i > 1)	{
				
				mat4.copy(modelMatrix, rotationMatrix);

				mat4.translate(modelMatrix, modelMatrix, [j*(i-1)*0.4*2/orbs, 0, 0]);
				mat4.rotateY(modelMatrix, modelMatrix, Math.getRadians(j*90));
				mat4.scale(modelMatrix, modelMatrix, [0.01, 0.01, 0.4*2/orbs]);
				
				drawModel(modelMatrix, exampleCylinder, mat);
				
			}
		}
		
	}
	
	if (play && !contextLost)	{
		
		aa+=a; if(aa > 360) { aa = 0; }
		bb+=b; if(bb > 360) { bb = 0; }
		requestAnimationFrame(drawScene);
		
	}
	
}

// Helper function that converts an angle from degrees to radians for the glMatrix rotation functions.
Math.getRadians = function(degrees) {

	return degrees * Math.PI / 180;

}

// Registers the DOM interaction handlers once: responsive redraws while paused, mouse camera controls, WebGL context loss/restoration and the keyboard controls that call the shared interaction functions below.
function initHandlers() {
    
	var mouseDown = false;
	var lastMouseX;
	var lastMouseY;

	var canvas = document.getElementById("myCanvas");
	
	// adds an event to detect when the canvas has been resized
	var resizeObserver = new ResizeObserver(function () {

		if (!play && !contextLost) {
			requestAnimationFrame(drawScene);
		}
	});

	resizeObserver.observe(canvas);

	canvas.addEventListener("mousedown",
	
			function(event) {
				
				mouseDown  = true;
				lastMouseX = event.clientX;
				lastMouseY = event.clientY;
				
			},
			
			false);

	canvas.addEventListener("mouseup",
	
			function() {
				
				mouseDown = false;
				
			},
			
			false);

	canvas.addEventListener("mousemove",
	
			function (event) {
			
				if (!mouseDown) {
					
					return;
					
				}
				
			var newX = event.clientX;
			var newY = event.clientY;
		
			if (event.shiftKey == 1) {
			
				if (event.altKey == 1) {
				
					// fovy
					fovy -= (newY - lastMouseY) / 100.0;
				
					if (fovy < 1) {
						fovy = 1;
					}
					
					if (fovy > 3.13)	{
						fovy = 3.13;	// less than PI for preventing numerical precision issues
					}
					
				} else {
					
					// radius
					radius -= (newY - lastMouseY) / 10.0;
				
					if (radius < 1.1) {
						radius = 1.1;
					}
				}
				
			} else {
				
				// position
				myphi -= (newX - lastMouseX);
				zeta  += (newY - lastMouseY);
			
				if (zeta < -80) {
					zeta = -80.0;
				}
				
				if (zeta > 80) {
					zeta = 80;
				}
			}
			
			lastMouseX = newX
			lastMouseY = newY;
	  
			if (!play) { requestAnimationFrame(drawScene); }
			
		},
		
		false);
	
	// CONTEXT MANAGEMENT
	canvas.addEventListener("webglcontextlost", function (event) {
		event.preventDefault();
		contextLost = true;
	});

	canvas.addEventListener("webglcontextrestored", async function () {
		try {
			await initWebGLResources();
			contextLost = false;
			requestAnimationFrame(drawScene);
		} catch (error) {
			contextLost = true;
			console.error(
				"Error restaurando WebGL:",
				error
			);
		}
	});
	
	// KEYBOARD EVENTS
	document.addEventListener("keydown",
	
		function(event) {
		
			switch (event.code)	{
				
				case  "KeyP": { if (!event.repeat) { pause(); } break; }
				
				case  "KeyM": { if (!event.repeat) { materialSwitch(); } break; }
				
				// orbit handlers (by even and odd orbits starting to count from the most external orbit)
				
				case "ArrowUp": { increaseOddOrbitSpeed(); break; }
				case "Numpad8": { increaseOddOrbitSpeed(); break; }

				case "ArrowDown": { decreaseOddOrbitSpeed(); break; }
				case "Numpad2": { decreaseOddOrbitSpeed(); break; }

				case "ArrowRight": { increaseEvenOrbitSpeed(); break; }
				case "Numpad6": { increaseEvenOrbitSpeed(); break; }

				case "ArrowLeft": { decreaseEvenOrbitSpeed(); break; }
				case "Numpad4": { decreaseEvenOrbitSpeed(); break; }

				case "Space": { manualForward(); break;	}
				case "Numpad5": { manualForward(); break; }
				
				case "Numpad0": { manualBackward(); break; }

				case "NumpadAdd": { increaseOrbits(); break; }
				
				case "NumpadSubtract": { subtractOrbits(); break; }
					
			}
		}, false);
}

// --- AUXILIARY CONTROL AND INTERACTION FUNCTION BLOCK STARTS HERE ---

// Toggles automatic animation. Pausing stops the render loop after the current frame; resuming explicitly requests a new frame so the loop starts again.
function pause() {
	
	if (play) {
		play = false;
		} else {
			play = true;
			requestAnimationFrame(drawScene);
		}
		
}

// Sets the camera radius used by the frontend zoom control while preserving
// the minimum safe distance already enforced by the direct camera controls.
function setZoom(zoomValue) {
	radius = Math.max(1.1, zoomValue);
	drawIfPaused();
}

// Preserves the original (legacy) one-way material-switch control by moving to the next material through changeMaterial().
function materialSwitch() {
	changeMaterial(1);
}

// Moves through the material list in either direction with wrap-around, updates the active material and redraws immediately when the animation is paused.
function changeMaterial(direction) {
	materialIndex = (materialIndex + direction + materials.length) % materials.length;
	mat = materials[materialIndex];
	drawIfPaused();
}

// Increases the odd-orbit angular increment and immediately advances the odd orbit angle as well, so the same control remains visible and useful in paused/manual mode.
function increaseOddOrbitSpeed() {
	a+=0.1;
	aa+=a;
	drawIfPaused()
}

// Decreases the odd-orbit angular increment and immediately moves the odd orbit angle in the corresponding direction, updating the paused scene when needed.
function decreaseOddOrbitSpeed() {
	a-=0.1;
	aa-=a;
	drawIfPaused()
}

// Increases the even-orbit angular increment and immediately advances the even orbit angle as well, so the same control remains visible and useful in paused/manual mode.
function increaseEvenOrbitSpeed() {
	b+=0.1;
	bb+=b;
	drawIfPaused()
}

// Decreases the even-orbit angular increment and immediately moves the even orbit angle in the corresponding direction, updating the paused scene when needed.
function decreaseEvenOrbitSpeed() {
	b-=0.1;
	bb-=b;
	drawIfPaused()
}

// Sets the same absolute angular speed for both orbit families.
// This is used by the simplified frontend while the advanced controls
// can still modify odd and even families independently.
function setOrbitSpeed(speedValue) {
	a = speedValue;
	b = speedValue;
	drawIfPaused();
}

// Advances both orbit groups by their current angular increments only while playback is paused, providing a manual step-forward control without restarting the animation loop.
function manualForward() {
	if (!play) {
		aa+=a;
		bb+=b;
		requestAnimationFrame(drawScene);
	}
}

// Moves both orbit groups backwards by their current angular increments only while playback is paused, providing the matching manual step-backward control.
function manualBackward() {
	if (!play) {
		aa-=a;
		bb-=b;
		requestAnimationFrame(drawScene);
	}
}

// Adds one orbit, rebuilds the dynamic torus buffers to match the new orbit count and redraws the scene immediately when paused.
function increaseOrbits() {
	orbs++;
	rebuildTorusBuffers();
	drawIfPaused();
}

// Removes one orbit while keeping at least one orbit in the scene, then rebuilds the dynamic torus buffers and redraws the paused scene.
function subtractOrbits() {
	if (orbs > 1) { orbs--; rebuildTorusBuffers(); drawIfPaused(); }
}

// Requests a single redraw when playback is paused and the WebGL context is valid, letting controls update the visible scene without restarting continuous animation.
function drawIfPaused() {
	if (!play && !contextLost) {
		requestAnimationFrame(drawScene);
	}
}

// --- AUXILIARY CONTROL AND INTERACTION FUNCTION BLOCK ENDS HERE ---

// Recreates every resource that belongs to the current WebGL context: shaders, primitive buffers, dynamic orbit buffers, rendering state and both sky textures. This is used for both first initialization and context restoration.
async function initWebGLResources() {
	gl = getWebGLContext();
	
	if (!gl) {
		throw new Error("WebGL no está disponible");
	}
	
	initShaders();
	initPrimitives();
	createTorusBuffers();
	initRendering();
	
	var images = await Promise.all([
		loadImage("maps/eve_sky.png"),
		loadImage("maps/starlight_sky.png")
	]);
	
	// console logs tracing
	console.log(
			"Texturas cargadas:",
			images[0].naturalWidth,
			images[0].naturalHeight,
			images[1].naturalWidth,
			images[1].naturalHeight
		);
	
	innerBackground = setTexture(
		"innerTexture",
		images[0],
		0
	);
	
	outerBackground = setTexture(
		"outerTexture",
		images[1],
		1
	);
}

// Initializes the application by registering the interaction handlers once, creating the WebGL resources asynchronously and requesting the first frame when initialization succeeds.
async function initApp() {
	initHandlers();

	try {
		await initWebGLResources();
		requestAnimationFrame(drawScene);
	} catch (error) {
		console.error("Error inicializando WebGL:", error);
	}
}

initApp();	// starts...
