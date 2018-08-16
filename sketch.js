var mic, fft;

var liveshader;
var lastshader;
var trueshader = true;

const helperfns = "precision lowp float;\n" +
"#define PI 3.14159265359\n"+
"#define TWO_PI 6.28318530718\n"+
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
"}\n"+
"mat2 rotate(float r) {\n" +
    "return mat2(cos(r),-sin(r),sin(r),cos(r));\n" +
"}\n" +
"float rect(vec2 uv,float w, float h) {\n" +
    "return  (min(min(w - uv.x, h - uv.y), \n" +
                "min(w + uv.x, h + uv.y)));\n" +
"}\n" +
"float ngon(vec2 uv, int n) {\n" +
    "float a = atan(uv.x,uv.y)+PI;\n" +
    "float r = TWO_PI/float(n);\n" +
    "return cos(floor(.5+a/r)*r-a)*length(uv);\n" +
"}\n" +
"float tshirt(vec2 uv, float size) {\n" +
    "return (min(max(max(rect(uv,size*.4,size*.5),\n" +
                       "rect(uv*rotate(.6)+vec2(.46,.1)*size,size*.15,size*.3)),\n" +
                    "rect(uv*rotate(-.6)+vec2(-.46,.1)*size,size*.15,size*.3))\n" +
                ", -(size*.25-ngon(uv+vec2(0.,-.65)*size,18))));\n" +
"}\n" ;



// raytrace fn
const norm = "vec3 normal(in vec3 p) {\n"+
"    const vec3 STEP = vec3(0.01, 0.0, 0.0);\n"+
"\n"+
"    float gradient_x = scene(p + STEP.xyy) - scene(p - STEP.xyy);\n"+
"    float gradient_y = scene(p + STEP.yxy) - scene(p - STEP.yxy);\n"+
"    float gradient_z = scene(p + STEP.yyx) - scene(p - STEP.yyx);\n"+
"\n"+
"    return normalize(vec3(gradient_x, gradient_y, gradient_z));\n"+
"}\n";
const rm = "vec3 raymarch(vec3 ray_origin, vec3 ray_direction) {\n"+
"\n"+
"    float dist_travelled = 0.0;\n"+
"    const int NUM_STEPS = 170;\n"+
"    const float MIN_HIT_DIST = 0.01;\n"+
"    const float MAX_TRACE_DIST = 1000.0;\n"+
"\n"+
"    for (int i = 1; i < NUM_STEPS; i++) {\n"+
"        vec3 current_pos = ray_origin + dist_travelled * ray_direction;\n"+
"\n"+
"        float closest_dist = scene(current_pos);\n"+
"\n"+
"        if(closest_dist < MIN_HIT_DIST) // hit\n"+
"            /* return vec3(1.,0.,0.); */\n"+
"            /* return normal(current_pos) * 0.5 + 0.5; */\n"+
"            return lighting(current_pos);\n"+
"\n"+
"        if(dist_travelled > MAX_TRACE_DIST)\n"+
"            break;\n"+
"\n"+
"        dist_travelled += closest_dist;\n"+
"    }\n"+
"\n"+
"    return vec3(0.0);\n"+
"}\n";

function setup() {
    fullscreen(true);
    console.log('test');
    try {
        createCanvas(windowWidth, windowHeight, WEBGL); 
    } catch (err) {
       console.log(localStorage.getItem('fragCode'));
    }
    console.log('test');

    mic = new p5.AudioIn();
    mic.start();
    mic.amp(.8);
    mic.connect();
    fft = new p5.FFT(0.4);
    fft.setInput(mic);
    //
    let precode = localStorage.getItem('fragCode');
    if(!precode) precode = 'void main() {\n    gl_FragColor = vec4(0.,0.,0.,1.);\n}';

    code = createElement('textarea', precode)
        .position(0,0)
        // .attribute("contenteditable", "true")
        .changed(updateShader);
        ;
    updateShader();
}


function draw() {

    if(frameCount%3 == 0) {
        if(mouseX < width/2) 
            code.style('opacity', .5);
        else
            code.style('opacity', 2 - (mouseX/width)*2);
    }

    var spectrum = fft.analyze();

    try {
        liveshader.setUniform("time", frameCount / 120.);
        liveshader.setUniform("res", [width,height]);
        liveshader.setUniform("fft", 
                [fft.getEnergy("bass"),
                 fft.getEnergy("mid"),
                 fft.getEnergy("treble")]);
        shader(liveshader);
        quad(-1, -1, 1, -1, 1, 1, -1, 1);
    } catch (err) {
        console.log("caught");
        shader(lastshader);
        quad(-1, -1, 1, -1, 1, 1, -1, 1);
        liveshader = lastshader;
        code.style("color", "#ff0000");
        code.style("text-shadow", "0 0 2px white");
    }
}

function updateShader() {
    lastshader = liveshader;
    let fragCode = code.value();


    localStorage.setItem('fragCode', fragCode);
    liveshader = createShader(
            "precision lowp float;" +
            "varying vec2 vPos;" +
            "attribute vec3 aPosition;" +
            "void main(){" +
            "  vPos = (gl_Position = vec4(aPosition, 1.0)).xy;" +
            "}"
            , 
            // code.elt.innerHTML
            helperfns +
            fragCode
                .replace("#include raymarch;", rm)
                .replace("#include normal;", norm)
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

