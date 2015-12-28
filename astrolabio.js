
var gl, program;
var myTorus;

var orbs = 4; // I want to be able to change the number of orbits

var  a = 0;	  // odd orbit angle increment
var  b = 0;   // pair orbit angle increment
var aa = 0;   // odd orbit angle
var bb = 0;   // pair orbit angle

var myphi = 0, zeta = 0, radius = 5, fovy = Math.PI/5;

var mat = Brass;
var shadingMode	= 0;

//  Gets Radians from a given angle in degrees
Math.getRadians = function(degrees) {

  return degrees * Math.PI / 180;

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

//  Concatenates model-view and camera matrix and draws given primitive
function concatenateMtxAndDrawWire(modelViewMatrix, modelMatrix, primitive) {
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  drawWire(primitive);
}

//  Puts together matrix to view in perspective and orders drawing
function drawInPerspective(modelMatrix, primitive, material) {
	
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
	
	drawSolid(primitive);
	
}

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

function initShaders() { 
    
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  
  switch (shadingMode)	{
	
	case 0:
		gl.shaderSource(vertexShader, document.getElementById("GouraudVertexShader").text);
		gl.shaderSource(fragmentShader, document.getElementById("GouraudFragmentShader").text);
		break;
		
	case 1:
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

function initRendering() { 

  gl.clearColor(0.15,0.15,0.15,1.0);
  gl.enable(gl.DEPTH_TEST);
  
  setShaderLight();

}

function initBuffers(model) {
    
  model.idBufferVertices = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
    
  model.idBufferIndices = gl.createBuffer ();
  gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

}

function initPrimitives() {

  //initBuffers(examplePlane);
  //initBuffers(exampleCube);
  //initBuffers(exampleCone);
  initBuffers(exampleCylinder);
  initBuffers(exampleSphere);

  myTorus = makeTorus(0.5, 1, 100, 100);
  initBuffers(myTorus);

}


function setShaderProjectionMatrix(projectionMatrix) {
  
  gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
  
}

function setShaderModelViewMatrix(modelViewMatrix) {
  
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  
}

function setShaderNormalMatrix(normalMatrix) {
  
  gl.uniformMatrix3fv(program.normalMatrixIndex, false, normalMatrix);
  
}

function getNormalMatrix(modelViewMatrix) {
  
  var normalMatrix = mat3.create();
  
  mat3.fromMat4  (normalMatrix, modelViewMatrix);
  mat3.invert    (normalMatrix, normalMatrix);
  mat3.transpose (normalMatrix, normalMatrix);
  
  return normalMatrix;
  
}

function getProjectionMatrix() {
  
  var projectionMatrix  = mat4.create();
  
  mat4.perspective(projectionMatrix, fovy, 1.0, 0.1, 100.0);
  
  return projectionMatrix;
  
}

function getCameraMatrix() {
  
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

function setShaderMaterial(material) {

  gl.uniform3fv(program.KaIndex,    material.mat_ambient);
  gl.uniform3fv(program.KdIndex,    material.mat_diffuse);
  gl.uniform3fv(program.KsIndex,    material.mat_specular);
  gl.uniform1f (program.alphaIndex, material.alpha);
  
}

function setShaderLight() {	// this must be modified to allow current colors to be saved after changing shaders

  gl.uniform3f(program.LaIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LdIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LsIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.PositionIndex, 10.0,10.0,0.0); // en coordenadas del ojo
  
}

function drawSolid(model) { 
    
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (program.vertexPositionAttribute, 3, gl.FLOAT, false, 2*3*4,   0);
  gl.vertexAttribPointer (program.vertexNormalAttribute,   3, gl.FLOAT, false, 2*3*4, 3*4);
    
  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

}

function drawScene() {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //	ORBITS
	var modelMatrix     = mat4.create();
	
	for (var i = 1; i <= orbs; i++)  {

      orbitTorus = makeTorus(0.02*i, 0.8*i, 6, 48);
      initBuffers(orbitTorus);
      // got to init buffer on-the-loop for each torus to allow different orbits number

      mat4.identity(modelMatrix);

      // --rotation begins here--

      mat4.rotateX(modelMatrix, modelMatrix, Math.getRadians(aa));
      mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(45));
      rotateOrbit(modelMatrix, orbs-i, aa, bb);

      // --rotation ends here--
	  
      var rotationMatrix = mat4.clone(modelMatrix);

      mat4.scale(modelMatrix, modelMatrix, [1/orbs, 1/orbs, 1/i]); // normalize orbits
	  drawInPerspective(modelMatrix, orbitTorus, mat);
	  
	  // ORBS
	  mat4.copy(modelMatrix, rotationMatrix);
	  
	  if ((orbs-i)%2 == 0)	{
		  mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(-90));	// --odds--
	  }
	  else{
		  mat4.rotateZ(modelMatrix, modelMatrix, Math.getRadians(45));	// --pairs-
	  }
	  mat4.translate(modelMatrix, modelMatrix, [i*0.4*2/orbs, 0, 0]);
	  mat4.scale(modelMatrix, modelMatrix, [1/orbs/3, 1/orbs/3, 1/orbs/3]);
	  
	  drawInPerspective(modelMatrix, exampleSphere, mat);
	  
	  // HANDLERS
      for (var j = -1; j < 2; j=j+2)  { // --two handlers for each orbit--
		
		if (i > 1)	{

			mat4.copy(modelMatrix, rotationMatrix);

			mat4.translate(modelMatrix, modelMatrix, [j*(i-1)*0.4*2/orbs, 0, 0]);
			mat4.rotateY(modelMatrix, modelMatrix, Math.getRadians(j*90));
			mat4.scale(modelMatrix, modelMatrix, [0.01, 0.01, 0.4*2/orbs]);

			drawInPerspective(modelMatrix, exampleCylinder, mat);
			
		}
      }
	}
	
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
				if (fovy < 0.001) {
					fovy = 0.1;
				}
			} else {
				// radius
				radius -= (newY - lastMouseY) / 10.0;
				if (radius < 0.01) {
					radius = 0.01;
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
	  
		requestAnimationFrame(drawScene);
    },
    false);
	
	// KEYBOARD EVENTS
	document.addEventListener("keydown",
		function(event) {
		
			switch (event.keyCode)	{
				
				// 	select shader (it will be erased on release)
				case  67:																	// iterates through shaders
					shadingMode++;
					if(shadingMode > 1) {shadingMode = 0};
				
					gl = getWebGLContext();
					initShaders();
					initRendering();
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
				drawScene();
				
		},
		false);

}        

function setColor (index, value) {

  var myColor = value.substr(1); // para eliminar el # del #FCA34D
      
  var r = myColor.charAt(0) + '' + myColor.charAt(1);
  var g = myColor.charAt(2) + '' + myColor.charAt(3);
  var b = myColor.charAt(4) + '' + myColor.charAt(5);

  r = parseInt(r, 16) / 255.0;
  g = parseInt(g, 16) / 255.0;
  b = parseInt(b, 16) / 255.0;
  
  gl.uniform3f(index, r, g, b);
  
}

function initWebGL() {
    
  gl = getWebGLContext();
    
  if (!gl) {
    alert("WebGL no está disponible");
    return;
  }
    
  initShaders();
  initPrimitives();
  initRendering();
  initHandlers();
  
  requestAnimationFrame(drawScene);
  
}

initWebGL();
