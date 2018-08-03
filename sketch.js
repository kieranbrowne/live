var mic, fft;

var liveshader;
var lastshader;
var trueshader = true;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL); 

    mic = new p5.AudioIn();
    mic.start();
    mic.connect();
    fft = new p5.FFT();
    fft.setInput(mic);

    code = createElement('textarea', 'precision highp float;\nuniform vec3 fft;\nvoid main() { gl_FragColor = vec4(0.,0.,0.,1.); }')
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
