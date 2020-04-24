# WebRTC Demo

## Foreword

This is an experiment project for getting WebRTC to work in a client-server manner with one-way video streaming. From the Camera View, you can start streaming from your web cam and create a "room" for sending the video stream, and from the Client View, you can join a room and view the video stream.

Both the camera and client programs act as WebRTC clients, and the signaling server is in `index.js`.

I don't really know what I'm doing yet. I got all this code from playing around with [this Google code lab](https://codelabs.developers.google.com/codelabs/webrtc-web/#7).

## Instructions

### Starting the server

If running for the first time, do `npm install` in the root directory to install dependencies. Run `node index.js` to start the server.

### Starting Live Video Stream

Go to <http://[[ip_of_host_machine]]:8080/camera> in your browser. Click **Create Room** and enter any room name. You can select **Start Video** before or after creating a room.

### Viewing Video Stream as Client

In another browser tab or window, go to <http://[[ip_of_host_machine]]:8080/client>. Select **Join Room** and enter the same room name. Then select **View Stream**, and you should see the video coming from the machine running the Camera View.
