let capture;

function setup() {

    //const {ipcRenderer} = require('electron');
    loadingProgress = 0;
    loadingMax = 0;

    // Immediatly resize window to the correct size
    //ipcRenderer.send('resize-me-please')

    //window size
    width = window.innerWidth;
    height = window.outerHeight;

    frames = 0;

    //this will hold the motion grid blocks
    motionActivityMap = {
        config: {
            blocksLong: 50,
            blocksTall: 50,
            sensitivity: 30, // 1 out of 100
        },
        motionBlocks: [],
        motionBlockID: 0,
        triggered: false,
    }
    document.getElementById("sensitivity").innerHTML = "sensitivity: " + motionActivityMap.config.sensitivity + "%,";
    loadingMax = motionActivityMap.config.blocksLong * motionActivityMap.config.blocksTall;
    document.getElementById("motionBlockGrid").innerHTML = "motionBlockGrid: " + motionActivityMap.config.blocksLong + "x" + motionActivityMap.config.blocksTall + ",";

    //creating each motion grid block
    generateMotionBlocks(motionActivityMap);

    motionActivityMap.totalMotionBlocks = motionActivityMap.config.blocksLong * motionActivityMap.config.blocksTall;


    //create the canvas and set up a videos stream
    createCanvas(width, height);

    canvas = document.getElementById("defaultCanvas0");
    ctx = canvas.getContext("2d");

    capture = createCapture(VIDEO);
    capture.size(width, height);
    capture.hide();

    //make the motion processing happen 10 times per sec
    setInterval(cameraProcess, 1000 / 10)
}

function cameraProcess() {
    lastLoop = new Date();

    //clear canvas
    background(255);

    //draw current video frame onto canvas
    image(capture, 0, 0, width, height + 20);

    //draw a grid
    // grid(motionActivityMap.config);
    frames++;
    amountActive = 0;
    for (var i in motionActivityMap.motionBlocks) {

        motionActivityMap.motionBlocks[i].update();

        motionActivityMap.motionBlocks[i].draw();

        if (motionActivityMap.motionBlocks[i].activityLevel == 1) {
            amountActive++;
        }
    }
    if (((amountActive / motionActivityMap.totalMotionBlocks) * 100) > 3) {
        motionActivityMap.triggered = true;
        document.getElementById("alert").style.display = "block";
    } else {
        motionActivityMap.triggered = false;
        document.getElementById("alert").style.display = "none";

    }
    document.getElementById("triggered").innerHTML = "triggered: " + motionActivityMap.triggered + ","
        // filter('INVERT');

    document.getElementById("date").innerHTML = new Date();

    textSize(16);

    thisLoop = new Date();
    fps = 1000 / (thisLoop - lastLoop);
    document.getElementById("fps").innerHTML = "fps: " + fps.toFixed(4) + ",";
    console.log(fps)
}

function motionBlock(x, y, w, h, s) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.highlight = false;
    this.sensitivity = s;
    this.activityLevel = 0;

    this.normalColorTotal = 0;
    this.normalColor = 0;
    this.normalColorCount = 0;

    this.colorNowTotal = 0;
    this.colorNow = 0;
    this.colorNowCount = 0;

    this.update = function() {
        this.colorNowCount = 0;
        this.colorNowTotal = 0;

        c = ctx.getImageData(this.x, this.y, this.w, this.h);

        data = c.data;

        for (i = 0; i < data.length; i += 4) {
            r = data[i];
            g = data[i + 1];
            b = data[i + 2];
            a = data[i + 3];

            this.colorNowCount++;
            this.normalColorCount++;

            // console.log((r + g + b) / 3)
            this.normalColorTotal += (r + g + b) / 3;
            this.colorNowTotal += (r + g + b) / 3;

        }
        this.normalColor = this.normalColorTotal / this.normalColorCount
        this.colorNow = this.colorNowTotal / this.colorNowCount;

        if (frames != 1) {

            this.difference = (this.normalColor - this.colorNow) / this.normalColor * 100;
            if (this.difference < 0) {
                this.difference = this.difference * -1;
            }

            if (this.difference > this.sensitivity) {
                this.activityLevel = 1
            } else {
                this.activityLevel = 0
            }
        }

    }
    this.draw = function() {
        if (this.activityLevel == 1) {
            stroke(0, 255, 0);
            line(this.x, this.y, this.x + this.w, this.y);
            line(this.x + this.w, this.y, this.x + this.w, this.y + this.h);
            line(this.x + this.w, this.y + this.h, this.x, this.y + this.h);
            line(this.x, this.y + this.h, this.x, this.y);
        }
        if (this.activityLevel == 0) {
            stroke(255, 255, 255);
        }
        if (this.highlight) {
            stroke(255, 255, 255);
            line(this.x, this.y, this.x + this.w, this.y);
            line(this.x + this.w, this.y, this.x + this.w, this.y + this.h);
            line(this.x + this.w, this.y + this.h, this.x, this.y + this.h);
            line(this.x, this.y + this.h, this.x, this.y);
        }



        //fill(1);
        // text(this.normalColor.toFixed(10), this.x + this.w/2, this.y + this.h/2);
        // text(this.colorNow.toFixed(10), this.x + this.w/2, this.y + this.h/2 + 20);
        // text(this.difference.toFixed(10), this.x + this.w/2, this.y + this.h/2 + 40);
        // text(this.activityLevel, this.x + this.w/2, this.y + this.h/2);


    }
}

function generateMotionBlocks(motionActivityMapObject) {

    for (var x = 0; x < motionActivityMap.config.blocksLong; x++) {
        for (var y = 0; y < motionActivityMap.config.blocksTall; y++) {
            //console.log("new block")
            motionActivityMapObject.motionBlocks.push(
                new motionBlock(
                    x * width / motionActivityMapObject.config.blocksLong,
                    y * height / motionActivityMapObject.config.blocksTall,
                    width / motionActivityMapObject.config.blocksLong,
                    height / motionActivityMapObject.config.blocksTall,
                    motionActivityMapObject.config.sensitivity
                )
            )
            loadingProgress++;
            document.getElementById("loadingProgress").style.width = Math.floor((loadingProgress / loadingMax) * 100) + "%";
            if (Math.floor((loadingProgress / loadingMax) * 100) == 100) {
                document.getElementById("loadingScreen").style.display = "none"
            }
            console.log(document.getElementById("loadingProgress").style.width)
        }
    }

}

function grid(config) {
    for (var x = 0; x < width / config.blocksLong; x++) {
        for (var y = 0; y < height / config.blocksTall; y++) {
            stroke(0);
            strokeWeight(1);
            line(x * width / config.blocksLong, 0, x * width / config.blocksLong, height);
            line(0, y * height / config.blocksTall, width, y * height / config.blocksTall);
        }
    }
}