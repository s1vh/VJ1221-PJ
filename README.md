# VJ1221-PJ
VJ1221 project (Course 2015/16)

This is a GLSL WebGL demo.

You can increase/decrease the number of orbits with ADD and SUBS keys respectively.
There's a pause/play function by preshing the P key. Also, you can control pair and odd rings separately with the numpad.
You can iterate through a sort of materials with the M key.
Note that the C key that was intended to switch between different shaders for testing purposes has been disabled on the final version.

Camera can be handled by mouse dragging: drag for angle, SHIFT + dragging for zoom and ALT + SHIFT + dragging for perspective.
Zoom and fovy ranges have been adjusted.

Background uses two sphere maps with transparency in order to create a more realistic depth effect.

A race condition when loading images has been fixed from the original project back from 2015, now it should load without trouble.

Because browser policies have become stricter since the project was created, testing it now requires configuring a local web server from the project's root folder. For example:

python -m http.server 8000

To open the project at http://localhost:8000/astrolabio.html in a compatible browser (WebGL 1).

	-made by s1vh (al285854@uji.es)
  
