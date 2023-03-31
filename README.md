Open three terminals and 
```bash
source venv/bin/activate
```

```bash
cd signaling
python server.py
```

```bash
cd python-client
python sio_client.py
```

```bash
cd web
python -m http.server 7000
```

Then open http://127.0.0.1:7000/ in your browser

## What's happening?
This launches a signaling server, a python WebRTC client and a python  
(all the python webserver does is host files for the client to read).  
The signaling server use socketio to create a room and pass data between the 
clients

The analogies are
Signaling Server - Something Fleet Services would own in the cloud
Python Client - Zip
Python Webserver - Fleetdeck backend
Local Browser - Fleetdeck Frontend