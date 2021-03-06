
var gl, program;
var myTorus;

var orbs = 4;	// I want to be able to change the number of orbits

var  a	 = 1;	// odd orbit angle increment
var  b	 = 1;   // pair orbit angle increment
var aa	 = 0;   // odd orbit angle
var bb	 = 0;   // pair orbit angle

var play = true;

var myphi = 0, zeta = 0, radius = 2, fovy = Math.PI/2.4;

var mat 		= Chrome;
var shadingMode	= 0;

var innerBackgroundImage = new Image();
innerBackgroundImage.src = "maps/eve_sky.png";

var outerBackgroundImage = new Image();
outerBackgroundImage.src = "maps/starlight_sky.png";

function getWebGLContext() {
    
	var canvas = document.getElementById("myCanvas");
    
	var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    
	for (var i = 0; i < names.length; ++i) {
		
		try {
			
			return canvas.getContext(names[i]);
			
		}
		
		catch(e) {
			
		}
	}
  
	return null;

}

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
	
	// normales
	program.vertexNormalAttribute = gl.getAttribLocation ( program, "VertexNormal");
	program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
	gl.enableVertexAttribArray(program.vertexNormalAttribute);
	
	// coordenadas de textura
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
	
	// fuente de luz
	program.LaIndex               = gl.getUniformLocation( program, "Light.La");
	program.LdIndex               = gl.getUniformLocation( program, "Light.Ld");
	program.LsIndex               = gl.getUniformLocation( program, "Light.Ls");
	program.PositionIndex         = gl.getUniformLocation( program, "Light.Position");
	
}

function initRendering()	{
	
	gl.clearColor(0.0,0.0,0.0,1.0);
	gl.enable(gl.DEPTH_TEST);
	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_DST_COLOR);
	
	setShaderLight();
	
}

function initBuffers(model)	{
	
	model.idBufferVertices = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
	
	model.idBufferIndices = gl.createBuffer ();
	gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
	gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
	
}

function initPrimitives()	{
	
	// I only need these three primitives for this build
	initBuffers(exampleCylinder);
	initBuffers(exampleSphere);
	
	myTorus = makeTorus(0.5, 1, 100, 100);
	initBuffers(myTorus);
	
}


function setShaderProjectionMatrix(projectionMatrix)	{
	
	gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
	
}

function setShaderModelViewMatrix(modelViewMatrix)	{
	
	gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
	
}

function setShaderNormalMatrix(normalMatrix)	{
	
	gl.uniformMatrix3fv(program.normalMatrixIndex, false, normalMatrix);
	
}

function getNormalMatrix(modelViewMatrix)	{
	
	var normalMatrix = mat3.create();
	
	mat3.fromMat4  (normalMatrix, modelViewMatrix);
	mat3.invert    (normalMatrix, normalMatrix);
	mat3.transpose (normalMatrix, normalMatrix);
	
	return normalMatrix;
	
}

function getProjectionMatrix()	{
	
	var projectionMatrix  = mat4.create();
	
	mat4.perspective(projectionMatrix, fovy, 1.0, 0.1, 100.0);
	
	return projectionMatrix;
	
}

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

function setShaderMaterial(material)	{
	
	gl.uniform3fv(program.KaIndex,    material.mat_ambient);
	gl.uniform3fv(program.KdIndex,    material.mat_diffuse);
	gl.uniform3fv(program.KsIndex,    material.mat_specular);
	gl.uniform1f (program.alphaIndex, material.alpha);
	
}

function setShaderLight()	{	// this must be modified to allow current colors to be saved after changing shaders
	
	gl.uniform3f(program.LaIndex,       1.0,1.0,1.0);
	gl.uniform3f(program.LdIndex,       1.0,1.0,1.0);
	gl.uniform3f(program.LsIndex,       1.0,1.0,1.0);
	gl.uniform3f(program.PositionIndex, 10.0,10.0,0.0); // en coordenadas del ojo
	
}

// CARGA TEXTURA
function setTexture(tag, name, image, unit)	{
	
	// creación de la textura
	name = gl.createTexture();
	
	// se marca como activa la unidad correspondiente
	switch(unit)	{
		
		case 0:
		
			gl.activeTexture(gl.TEXTURE0); break;
			
		case 1:
		
			gl.activeTexture(gl.TEXTURE1); break;
			
	}
	
	gl.bindTexture(gl.TEXTURE_2D, name);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	
	// (set maps are always power of 2 so I don't need to check it)
	
	// datos de la textura
	gl.texImage2D(gl.TEXTURE_2D, false, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	
	// parámetros de filtrado
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	// parámetros de repetición (ccordenadas de textura mayores a uno)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	
	// creación del mipmap
	gl.generateMipmap(gl.TEXTURE_2D);
	
	// se asigna el objeto textura a la unidad activa
	gl.bindTexture(gl.TEXTURE_2D, name);
	
	// se obtiene la referencia a la variable de tipo sampler2D en el shader
	program.textureIndex = gl.getUniformLocation(program, tag);
	
	// se asocia la variable de tipo sampler2D a una unidad de textura
	gl.uniform1i(program.textureIndex, unit);
	
}

function drawSolid(model)	{
	
	gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
	gl.vertexAttribPointer (program.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
	gl.vertexAttribPointer (program.vertexNormalAttribute,    3, gl.FLOAT, false, 8*4, 3*4);
	gl.vertexAttribPointer (program.vertexTexcoordsAttribute, 2, gl.FLOAT, false, 8*4, 6*4);
	
	gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
	gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
	
}

//  Joins model-camera-view matrixes to create perspective and orders drawing
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

//	Draws the background while ignoring radial distance
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

//  Rotates orbits +/-45 degrees sequentially
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

function drawScene() {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var modelMatrix     = mat4.create();
	
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
		
		orbitTorus = makeTorus(0.02*i, 0.8*i, 6, 48);
		initBuffers(orbitTorus);	// got to init buffer on-the-loop for each torus to allow different orbits number
		
		mat4.identity(modelMatrix);
		
		// --rotation begins here--
		mat4.rotateX(modelMatrix, modelMatrix, Math.getRadians(aa));
		mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(45));
		rotateOrbit(modelMatrix, orbs-i, aa, bb);
		// --rotation  ends  here--
		
		var rotationMatrix = mat4.clone(modelMatrix);
		
		mat4.scale(modelMatrix, modelMatrix, [1/orbs, 1/orbs, 1/i]); // normalize orbits
		drawModel(modelMatrix, orbitTorus, mat);
		
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
	
	if (play)	{
		
		aa+=a; if(aa > 360) { aa = 0; }
		bb+=b; if(bb > 360) { bb = 0; }
		requestAnimationFrame(drawScene);
		
	}
	
}

//  Gets Radians from a given angle in degrees
Math.getRadians = function(degrees) {

	return degrees * Math.PI / 180;

}

function initHandlers() {
    
	var mouseDown = false;
	var lastMouseX;
	var lastMouseY;

	var canvas = document.getElementById("myCanvas");

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
	
	// KEYBOARD EVENTS
	document.addEventListener("keydown",
	
		function(event) {
		
			switch (event.keyCode)	{
				
				// iterates through shaders
				// *LOCKED*
				//case  67:
				
					//shadingMode++;
					
					//if(shadingMode > 2) {shadingMode = 0};
				
					//gl = getWebGLContext();
					//initShaders();
					//initRendering();
					
					//break;
					
				case  80:		// turn ON/OFF movie
					
					if (play)	{
						
						play = false;
						
					}	else	{
						
						play = true;
						requestAnimationFrame(drawScene);
						
					}
					
					break;
					
				case  77:		// material switch
					
					switch (mat)	{
						
						case Brass:
							
							mat = Bronze;			break;
							
						case Bronze:
							
							mat = Polished_bronze;	break;
							
						case Polished_bronze:
							
							mat = Chrome;			break;
							
						case Chrome:
							
							mat = Copper;			break;
							
						case Copper:
							
							mat = Polished_copper;	break;
							
						case Polished_copper:
							
							mat = Gold;				break;
							
						case Gold:
							
							mat = Polished_gold;	break;
							
						case Polished_gold:
							
							mat = Tin;				break;
							
						case Tin:
							
							mat = Silver;			break;
							
						case Silver:
							
							mat = Polished_silver;	break;
							
						case Polished_silver:
							
							mat = Esmerald;			break;
							
						case Esmerald:
							
							mat = Jade;				break;
							
						case Jade:
							
							mat = Obsidian;			break;
							
						case Obsidian:
							
							mat = Perl;				break;
							
						case Perl:
							
							mat = Ruby;				break;
							
						case Ruby:
							
							mat = Turquoise;		break;
							
						case Turquoise:
							
							mat = Brass;			break;
							
					}
					
					break;
				
				// orbit handlers (it will be mouse-wise on release)
				case  38: { a+=0.1; aa+=a; break; }		// alfa up    (up arrow)
				case 104: { a+=0.1; aa+=a; break; }		// alfa up    (numpad 8)

				case  40: { a-=0.1; aa-=a; break; }		// alfa down  (down arrow)
				case  98: { a-=0.1; aa-=a; break; }		// alfa down  (numpad 2)

				case  39: { b+=0.1; bb+=b; break; }		// beta up    (right arrow)
				case 102: { b+=0.1; bb+=b; break; }		// beta up    (numpad 6)

				case  37: { b-=0.1; bb-=b; break; }		// beta down  (left arrow)
				case 100: { b-=0.1; bb-=b; break; }		// beta down  (numpad 4)

				case  32: { aa+=a;  bb+=b; break;	}	// rotate forward (spacebar)
				case 101: { aa+=a;  bb+=b; break; }		// rotate forward (numpad 5)
				case  96: { aa-=a;  bb-=b; break; }		// rotate backward (numpad 0)

				case 107: { orbs++; break; }				// increases orbits   (add)
				case 109: if (orbs > 1)	{ orbs--; break; }	// substracts orbits  (substract)
					
				}
				
				if (!play) { requestAnimationFrame(drawScene); }
				
		},
		
		false);
		
}        

function initWebGL() {
    
	gl = getWebGLContext();
    
	if (!gl) {
		
		alert("WebGL no está disponible");
		
		return;
		
	}
	
	initShaders();
	
	var innerBackground;
	setTexture('innerTexture', innerBackground, innerBackgroundImage, 0);
	var outerBackground;
	setTexture('outerTexture', outerBackground, outerBackgroundImage, 1);
	
	initPrimitives();
	initRendering();
	initHandlers();
	
	requestAnimationFrame(drawScene);
	
}

initWebGL();
