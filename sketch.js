var mic, fft;

var liveshader;
var lastshader;
var trueshader = true;

const helperfns = "precision highp float;\n" +
"float rand(vec2 c){\n"+
"	return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);\n"+
"}\n"+
"\n"+
"// Some useful functions\n"+
"vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }\n"+
"vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }\n"+
"vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }\n"+
"\n"+
"//\n"+
"// Description : GLSL 2D simplex noise function\n"+
"//      Author : Ian McEwan, Ashima Arts\n"+
"//  Maintainer : ijm\n"+
"//     Lastmod : 20110822 (ijm)\n"+
"//     License :\n"+
"//  Copyright (C) 2011 Ashima Arts. All rights reserved.\n"+
"//  Distributed under the MIT License. See LICENSE file.\n"+
"//  https://github.com/ashima/webgl-noise\n"+
"//\n"+
"float noise(vec2 v) {\n"+
"\n"+
"    const vec4 C = vec4(0.211324865405187,\n"+
"                        // (3.0-sqrt(3.0))/6.0\n"+
"                        0.366025403784439,\n"+
"                        // 0.5*(sqrt(3.0)-1.0)\n"+
"                        -0.577350269189626,\n"+
"                        // -1.0 + 2.0 * C.x\n"+
"                        0.024390243902439);\n"+
"                        // 1.0 / 41.0\n"+
"\n"+
"    vec2 i  = floor(v + dot(v, C.yy));\n"+
"    vec2 x0 = v - i + dot(i, C.xx);\n"+
"\n"+
"    vec2 i1 = vec2(0.0);\n"+
"    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);\n"+
"    vec2 x1 = x0.xy + C.xx - i1;\n"+
"    vec2 x2 = x0.xy + C.zz;\n"+
"\n"+
"    i = mod289(i);\n"+
"    vec3 p = permute(\n"+
"            permute( i.y + vec3(0.0, i1.y, 1.0))\n"+
"                + i.x + vec3(0.0, i1.x, 1.0 ));\n"+
"\n"+
"    vec3 m = max(0.5 - vec3(\n"+
"                        dot(x0,x0),\n"+
"                        dot(x1,x1),\n"+
"                        dot(x2,x2)\n"+
"                        ), 0.0);\n"+
"\n"+
"    m = m*m ;\n"+
"    m = m*m ;\n"+
"\n"+
"\n"+
"    vec3 x = 2.0 * fract(p * C.www) - 1.0;\n"+
"    vec3 h = abs(x) - 0.5;\n"+
"    vec3 ox = floor(x + 0.5);\n"+
"    vec3 a0 = x - ox;\n"+
"\n"+
"    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);\n"+
"\n"+
"    vec3 g = vec3(0.0);\n"+
"    g.x  = a0.x  * x0.x  + h.x  * x0.y;\n"+
"    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);\n"+
"    return 130.0 * dot(m, g);\n"+
"}\n";

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL); 

    mic = new p5.AudioIn();
    mic.start();
    mic.connect();
    fft = new p5.FFT();
    // fft.setInput(mic);

    code = createElement('textarea', 'uniform vec3 fft;\nuniform vec2 uResolution;\nvoid main() {\n    vec2 uv = gl_FragCoord.xy / uResolution - 1.;\n    uv.x *= uResolution.x / uResolution.y;\n    gl_FragColor = vec4(0.,0.,0.,1.);\n}')
        .position(0,0)
        // .attribute("contenteditable", "true")
        .changed(updateShader);
        ;
    // liveshader = createShader("","");
    updateShader();
}


function draw() {

    var spectrum = fft.analyze();

    //

    console.log();

    try {
        liveshader.setUniform("uTime", frameCount / 120.);
        liveshader.setUniform("uResolution", [width,height]);
        liveshader.setUniform("fft", 
                [spectrum.slice(1,300).reduce((x,y)=>x+y)/300,
                 spectrum.slice(300,600).reduce((x,y)=>x+y)/300,
                 spectrum.slice(600,1024).reduce((x,y)=>x+y)/424]);
        shader(liveshader);
        quad(-1, -1, 1, -1, 1, 1, -1, 1);
    } catch (err) {
        console.log("caught");
        shader(lastshader);
        quad(-1, -1, 1, -1, 1, 1, -1, 1);
        liveshader = lastshader;
        code.style("color", "#000000");
        code.style("text-shadow", "0 0 2px white");
    }

}

function updateShader() {
    lastshader = liveshader;
    liveshader = createShader(
            "precision highp float;" +
            "varying vec2 vPos;" +
            "attribute vec3 aPosition;" +
            "void main(){" +
            "  vPos = (gl_Position = vec4(aPosition, 1.0)).xy;" +
            "}"
            , 
            // code.elt.innerHTML
			helperfns +
            code.value()
            );
    code.style("color", "#ffffff");
    code.style("text-shadow", "0 0 4px black");
    console.log("passed createshader");
}

function keyReleased(e) {
    console.log(code.elt.innerHTML);

    console.log(e);

    if (keyCode != LEFT_ARROW && 
        keyCode != RIGHT_ARROW &&
        keyCode != UP_ARROW &&
        keyCode != DOWN_ARROW &&
        keyCode != TAB &&
        keyCode != 32
        )
    updateShader();
}

function keyPressed(e) {
    if(keyCode == TAB)
        e.preventDefault();
}

