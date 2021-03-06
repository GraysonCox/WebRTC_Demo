'use strict';

const MAX_CLIENTS = 3;

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new nodeStatic.Server();
var app = http.createServer((req, res) => {
	fileServer.serve(req, res);
}).listen(8080);

var io = socketIO.listen(app);
io.sockets.on('connection', (socket) => {

	socket.on('message', (message) => {
		log('Client said: ', message);
		// for a real app, would be room-only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', (room) => {
		log(`Received request to create or join room ${room}.`);

		var clientsInRoom = io.sockets.adapter.rooms[room];
		var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

		log(`Room ${room} now has ${numClients} client(s).`);

		if (numClients === 0) {
			socket.join(room);
			log(`Client ID ${socket.id} created room ${room}.`);
			socket.emit('created', room, socket.id);
		} else if (numClients <= MAX_CLIENTS) {
			log(`Client ID ${socket.id} joined room ${room}.`);
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room, socket.id);
			io.sockets.in(room).emit('ready');
		} else { // max two clients
			socket.emit('full', room);
		}
	});

	socket.on('ipaddr', () => {
		var ifaces = os.networkInterfaces();
		for (var dev in ifaces) {
			ifaces[dev].forEach((details) => {
				if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
					socket.emit('ipaddr', details.address);
				}
			});
		}
	});

	// Convenience function to log server messages on the client
	function log() {
		var array = ['SERVER:'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

});
