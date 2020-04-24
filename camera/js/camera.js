'use strict';

const localVideo = document.getElementById('localVideo');
const createRoomButton = document.getElementById('createRoomButton');
const startButton = document.getElementById('startButton');
const closeStreamButton = document.getElementById('closeStreamButton');

createRoomButton.addEventListener('click', createRoom);
startButton.addEventListener('click', startVideo);
closeStreamButton.addEventListener('click', closeStream);

closeStreamButton.disabled = true;

var room;
var socket;
var peerConnection;
var localStream;

var videoConstraints = {
	audio: false,
	video: {
		width: {
			min: 1280
		},
		height: {
			min: 720
		}
	}
}

/**
 *	Opens a socket connection with the specified "room" name.
 */
function createRoom() {
	room = prompt('Enter room name:');
	socket = io.connect();

	if (room !== '') {
		createRoomButton.disabled = true;
		closeStreamButton.disabled = false;
		socket.emit('create or join', room);
		console.log('Attempted to create or join room', room);
	}

	socket.on('created', (room) => console.log(`Created room ${room}.`));
	socket.on('full', (room) => console.log(`Room ${room} is full`));
	socket.on('join', (room) => console.log(`A client has joined the room ${room}.`));
	socket.on('joined', (room) => console.error(`Joined: ${room}.`)); // TODO: This shouldn't happen.
	socket.on('log', (array) => console.log.apply(console, array));
	socket.on('message', handleMessage);
}

/**
 *	Starts capturing video from the web cam and displays it in the view.
 */
function startVideo() {
	navigator.mediaDevices.getUserMedia(videoConstraints)
		.then((mediaStream) => {
			console.log('Got MediaStream:', mediaStream);
			localStream = mediaStream;
			localVideo.srcObject = mediaStream;
		})
		.catch((error) => {
			console.error('getUserMedia() error:', error);
		});

}

/**
 *	Closes the RTCPeerConnection and socket connection.
 */
function closeStream() {
	peerConnection.close();
	socket.close();
	createRoomButton.disabled = false;
	startButton.disabled = false;
	closeStreamButton.disabled = true;
}

/**
 *	Handles messages from the signaling server.
 */
function handleMessage(message) {
	switch (message.type) {
		case 'offer':
			peerConnection = new RTCPeerConnection();
			peerConnection.setRemoteDescription(new RTCSessionDescription(message));
			peerConnection.onicecandidate = (event) => {
				console.log('Received ICE candidate event:', event);
				if (event.candidate) {
					socket.emit('message', {
						type: 'candidate',
						label: event.candidate.sdpMLineIndex,
						id: event.candidate.sdpMid,
						candidate: event.candidate.candidate
					});
				} else {
					console.log('End of candidates.');
				}
			};
			localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
			console.log('Sending answer to client.');
			peerConnection.createAnswer().then(
				(sessionDescription) => {
					peerConnection.setLocalDescription(sessionDescription);
					socket.emit('message', sessionDescription);
				},
				(error) => {
					console.error('Failed to create session description:' + error);
				}
			);
			break;
		case 'candidate':
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			peerConnection.addIceCandidate(candidate);
			break;
		default:
			console.log('Received message:', message);
	}
}
