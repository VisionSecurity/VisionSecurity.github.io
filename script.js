window.onload = init

function init() {
    socket = io.connect('https://192.168.1.186:8080', {
        reconnect: true,
        secure: true
    });
    socket.on('connect', function(socket) {
        console.log('Connected!');
    });
    video = document.querySelector("#videoElement");

    canvas = document.getElementById("gc");
    diffCanvas = document.getElementById("dc");

    w = window.innerWidth / 2;
    h = window.innerHeight;

    canvas.width = w;
    canvas.height = h;

    diffCanvas.width = w;
    diffCanvas.height = h;

    ctx = canvas.getContext("2d")
    diffCtx = diffCanvas.getContext("2d")

    getWebCam();

    browserInfo = getBrowserInfo();

    console.log(browserInfo.browserVersion1b())


    setInterval(process, 1000 / 30);


}

function getWebCam() {
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
                video: true
            })
            .then(function(stream) {
                video.srcObject = stream;
            })
            .catch(function(error) {
                console.log(error);
            });
    }
}


function process() {

    img1 = ctx.getImageData(0, 0, w, h);

    ctx.drawImage(video, 0, 0, w, h);

    img2 = ctx.getImageData(0, 0, w, h);

    diff = diffCtx.createImageData(w, h);

    pixelmatch(img1.data, img2.data, diff.data, w, h, {
        threshold: 0.1
    });
    diffCtx.putImageData(diff, 0, 0);

    length = diff.data.length;
    count = 0;
    skipEvery = 50
    triggeredPercentage = 5
    for (var i = 0; i < length; i += skipEvery * 4) {
        if (diff.data[i] == 255) {
            count++;
        }
    }
    percentRed = (count / (length / skipEvery / 4)) * 100
    console.log(percentRed);
    if (percentRed > triggeredPercentage) {
        console.log("TRIGGERED: " + percentRed)
        sendSnapshot()
    }
}

waiting = false
waitTime = 4000

function sendSnapshot() {
    var img = canvas.toDataURL();
    //console.log(img)
    if (!waiting) {
        socket.emit('motionSnapshot', {
            img: img,
            deviceName: browserInfo.browserVersion1b().split("(")[1].split(")")[0]
        });
        console.log("SENDING SNAPSHOT TO SERVER")
        waiting = true;
        setTimeout(function() {
            waiting = false
        }, waitTime)
    }

}

function getBrowserInfo() {
    var info = {
        timeOpened: new Date(),
        timezone: (new Date()).getTimezoneOffset() / 60,
        pageon() {
            return window.location.pathname
        },
        referrer() {
            return document.referrer
        },
        previousSites() {
            return history.length
        },

        browserName() {
            return navigator.appName
        },
        browserEngine() {
            return navigator.product
        },
        browserVersion1a() {
            return navigator.appVersion
        },
        browserVersion1b() {
            return navigator.userAgent
        },
        browserLanguage() {
            return navigator.language
        },
        browserOnline() {
            return navigator.onLine
        },
        browserPlatform() {
            return navigator.platform
        },
        javaEnabled() {
            return navigator.javaEnabled()
        },
        dataCookiesEnabled() {
            return navigator.cookieEnabled
        },
        dataCookies1() {
            return document.cookie
        },
        dataCookies2() {
            return decodeURIComponent(document.cookie.split(";"))
        },
        dataStorage() {
            return localStorage
        },

        sizeScreenW() {
            return screen.width
        },
        sizeScreenH() {
            return screen.height
        },
        sizeDocW() {
            return document.width
        },
        sizeDocH() {
            return document.height
        },
        sizeInW() {
            return innerWidth
        },
        sizeInH() {
            return innerHeight
        },
        sizeAvailW() {
            return screen.availWidth
        },
        sizeAvailH() {
            return screen.availHeight
        },
        scrColorDepth() {
            return screen.colorDepth
        },
        scrPixelDepth() {
            return screen.pixelDepth
        },


        latitude() {
            return position.coords.latitude
        },
        longitude() {
            return position.coords.longitude
        },
        accuracy() {
            return position.coords.accuracy
        },
        altitude() {
            return position.coords.altitude
        },
        altitudeAccuracy() {
            return position.coords.altitudeAccuracy
        },
        heading() {
            return position.coords.heading
        },
        speed() {
            return position.coords.speed
        },
        timestamp() {
            return position.timestamp
        },


    };
    return info
}