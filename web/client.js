var pc = null;
const SIGNALING_SERVER_URL = 'http://localhost:9999';

let socket = io(SIGNALING_SERVER_URL, { autoConnect: true });

socket.on('data', (data) => {
    console.log('Data received: ',data);
    // Do we use data here or have to parse?
    pc.setRemoteDescription(data);
});

let sendData = (data) => {
    socket.emit('data', data);
};

let onTrack = (event) => {
    console.log('Add track');
    console.log(pc.connectionState)
    document.getElementById('video').srcObject = event.streams[0];
  };



function negotiate() {
    pc.addTransceiver('video', {direction: 'recvonly'});
    pc.addTransceiver('audio', {direction: 'recvonly'});
    return pc.createOffer().then(function(offer) {
        return pc.setLocalDescription(offer);
    }).then(function() {
        // wait for ICE gathering to complete
        return new Promise(function(resolve) {
            if (pc.iceGatheringState === 'complete') {
                resolve();
            } else {
                function checkState() {
                    console.log(pc.iceGatheringState)
                    if (pc.iceGatheringState === 'complete') {
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        });
    }).then(function() {
        var offer = pc.localDescription;
        sendData(offer)
    })
}

function start() {
    var config = {
        sdpSemantics: 'unified-plan'
    };

    if (document.getElementById('use-stun').checked) {
        config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
    }

    pc = new RTCPeerConnection(config);
    pc.ontrack = onTrack;
    setInterval(() => {
        pc.getStats(null).then((stats) => {
      
          stats.forEach((report) => {
            console.log("Stats " + report.type);

            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                console.log("Inbound rtp");
                // This is a video receive report, which contains the following metrics:
                var rtt = report.roundTripTime; // Round-trip time in milliseconds
                var frameRate = report.framesPerSecond; // Video frame rate in frames per second
                var packetsLost = report.packetsLost; // Number of lost video packets
                // Process the metrics here
                console.log(rtt, frameRate, packetsLost);
              }
              if (report.type === 'remote-outbound-rtp') {
                console.log("Remote outbound rtp");
                // This is a video receive report, which contains the following metrics:
                var rtt = report.roundTripTime; // Round-trip time in milliseconds
                // Process the metrics here
                console.log(rtt, frameRate, packetsLost);
              }
          });
      
        });
      }, 1000);

    // connect audio / video
    pc.addEventListener('track', function(evt) {
        console.log("Got event in connect")
        if (evt.track.kind == 'video') {
            document.getElementById('video').srcObject = evt.streams[0];
        } else {
            document.getElementById('audio').srcObject = evt.streams[0];
        }
    });

    document.getElementById('start').style.display = 'none';
    negotiate();
    document.getElementById('stop').style.display = 'inline-block';
}

function stop() {
    document.getElementById('stop').style.display = 'none';

    // close peer connection
    setTimeout(function() {
        pc.close();
    }, 500);
}