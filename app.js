const prompt = require('prompt-sync')();
const mongo = require('mongodb');
const http = require('http'); //TODO remove
const api = require('./api');
const fetch = require('node-fetch');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Welcome to Piper Chat!");

initializeClient()
	.then(displayPeerMenu)
	.catch(console.error);

readline.on('SIGINT', () => {close()});

function initializeClient() {
	//TODO get these values from datastore if they exist in the datastore
	let host = prompt("Enter an IP address for your chat server: ");
	let port = prompt("Enter a port number for your chat server: ");
	let screenname = prompt("Enter a screenname: ");
	//TODO save all in datastore

	return api.start(host, port, screenname);

	// return Promise.all([messageListenerPromise, serverStartPromise]);
}

async function displayPeerMenu() {
	//TODO loop
	let peers = [{"username": "hruz", "host": "localhost", "port": "3000"}, 
	{"username": "test", "host": "localhost", "port": "4000"}]; //TODO fetch all peers from mongoDB
	console.log("Select a peer to chat with, or enter 0 to create a new peer connection with " 
		+ "a currently active peer. Type control+C to quit");
	console.log("0) Create a new peer connection...");
	for(i=0; i<peers.length; i++) {
		console.log(i+1 + ") " + peers[i].username);
	}
	let selection = prompt("Enter a choice: ");
	if(selection == "0") {
		await addPeer()
			.then(newPeer => {
				peers.push(newPeer); 
				return newPeer;
			})
			.then(connectToPeer);
	}
	else if (selection > 0 && selection <= peers.length) {
		await connectToPeer(peers[selection-1]);
	}
	else {
		console.log("The option " + selection + " is out of range or is invalid");
	}
}

function addPeer() {
	let peerHost = prompt("Enter an IP address for the remote chat user: ");
	let peerPort = prompt("Enter a port number for the remote chat user: ");
	return fetch(`http://${peerHost}:${peerPort}/getStatus`)
		.then(response => response.text())
		.then(username => {
			console.log(username);
			//TODO stuck here somewhere => API endpoints do not appear to be alive
			console.log("inside addPeer");
			return Promise.resolve({"username" : username, "host" : peerHost, "port" : peerPort});
		})
		//TODO save the user in mongodb
		.then(peer => {
			console.log("Added " + peer.username);
			return Promise.resolve(peer);
		})
		.catch((err) => {
			if(err.code == "ECONNREFUSED") {
				console.log(`It does not appear that a chat client is running at ${peerHost}:${peerPort}, ` 
					+ `or there is something preventing you from reaching this connection`);
				console.log("Check the parameters and try again.");
				return Promise.reject();
			}
			else {
				console.error(err);
				return Promise.reject(err);
			}
		});
}

async function connectToPeer(peer) {
	console.log("Now chatting with " + peer.username + ". Type Control+C to quit");
	//TODO get old messages
	process.stdout.write("\n> ");
	
	readline.on("line", input => {
		process.stdout.write("> ");
		sendMessage(peer, input).then(response => {
			//TODO check that client is online
		});
	});
	api.apiEvent.on("receiveMessage", response => {
		process.stdout.write("\n" + response.timestamp + " " + response.sender + "> " + response.content);
		process.stdout.write("\n> ");
	});
}

function sendMessage(peer, message) {
	let body = {
		sender: peer.username,
		timestamp: new Date(),
		content: message
	}

	//TODO handle if the peer is offline
	return fetch(`http://${peer.host}:${peer.port}/receiveMessage`, {
		method: "POST",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

function close() {
	readline.close();
	console.log("Thank you for using Piper chat!");
	process.exit(0);
}
