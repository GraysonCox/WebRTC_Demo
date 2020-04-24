'use strict';

const remoteVideo = document.getElementById('remoteVideo');
const joinRoomButton = document.getElementById('joinRoomButton');
const viewStreamButton = document.getElementById('viewStreamButton');
const leaveRoomButton = document.getElementById('leaveRoomButton');

joinRoomButton.addEventListener('click', joinRoom);
viewStreamButton.addEventListener('click', viewStream);
leaveRoomButton.addEventListener('click', leaveRoom);

viewStreamButton.disabled = true;
leaveRoomButton.disabled = true;

var sdpConstraints = {
	offerToReceiveAudio: false,
	offerToReceiveVideo: true
};

var socket;
var room;
var peerConnection;
var remoteStream;

function joinRoom() {
	room = prompt('Enter room name:');
	socket = io.connect();

	if (room !== '') {
		socket.emit('create or join', room);
		joinRoomButton.disabled = true;
		viewStreamButton.disabled = false;
		leaveRoomButton.disabled = false;
		console.log(`Attempted to create or join room ${room}.`);
	}

	socket.on('created', (room) => console.log(`Created room ${room}.`)); // TODO: This shouldn't happen.
	socket.on('full', (room) => console.log(`Room ${room} is full.`));
	socket.on('join', (room) => console.log(`A client has joined the room ${room}.`));
	socket.on('joined', (room) => console.log(`Joined room ${room}.`));
	socket.on('log', (array) => console.log.apply(console, array));
	socket.on('message', handleMessage);
	socket.on('disconnect', leaveRoom); // TODO: This doesn't work.
}

function viewStream() {
	peerConnection = new RTCPeerConnection({
		configuration: sdpConstraints,
		iceServers: []
	});
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
	peerConnection.ontrack = (event) => {
		console.log('Received remote video stream.');
		remoteStream = event.streams[0];
		remoteVideo.srcObject = event.streams[0];
	};
	peerConnection.createOffer(sdpConstraints).then((sessionDescription) => {
			console.log('Creating offer.');
			peerConnection.setLocalDescription(sessionDescription);
			socket.emit('message', sessionDescription);
		},
		(error) => {
			console.error('Failed to open stream:', error);
		});
}

function leaveRoom() {
	peerConnection.close();
	socket.close();
	remoteVideo.srcObject = null;
	joinRoomButton.disabled = false;
	leaveRoomButton.disabled = true;
}

function handleMessage(message) {
	console.log('Received message:', message);
	switch (message.type) {
		case 'answer':
			peerConnection.setRemoteDescription(new RTCSessionDescription(message));
			break;
		case 'candidate':
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: message.label,
				candidate: message.candidate
			});
			peerConnection.addIceCandidate(candidate);
			break;
		default:

	}
}
