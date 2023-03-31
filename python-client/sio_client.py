import asyncio
import os
import platform
import socketio

from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay

ROOT = os.path.dirname(__file__)
sio = socketio.AsyncClient()

relay = None
webcam = None


def create_local_tracks(play_from, decode):
    global relay, webcam

    if play_from:
        player = MediaPlayer(play_from, decode=decode)
        return player.audio, player.video
    else:
        options = {"framerate": "30", "video_size": "640x480"}
        if relay is None:
            if platform.system() == "Darwin":
                webcam = MediaPlayer(
                    "default:none", format="avfoundation", options=options
                )
            elif platform.system() == "Windows":
                webcam = MediaPlayer(
                    "video=Integrated Camera", format="dshow", options=options
                )
            else:
                webcam = MediaPlayer("/dev/video0", format="v4l2", options=options)
            relay = MediaRelay()
        return None, relay.subscribe(webcam.video)


async def offer(params):
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print("Connection state is %s" % pc.connectionState)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    # open media source
    # audio, video = create_local_tracks(
    #     "/Users/bailey.battles/repo/webrtc/Recovery.mp4", decode=True,
    # )
    audio, video = create_local_tracks(
        None, decode=True,
    )

    if audio:
        pc.addTrack(audio)


    if video:
        pc.addTrack(video)

    await pc.setRemoteDescription(offer)

    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    await sio.emit('data', {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})



pcs = set()


async def on_shutdown(app):
    # close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


@sio.on('data')
async def on_data(data):
    if data['type'] == "offer":
        print(f"Got offer {data}")
        params = {
            "sdp": data['sdp'],
            "type": data["type"],
        }
        await offer(params)

async def main():
    await sio.connect("http://localhost:9999")
    while True:
        await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())