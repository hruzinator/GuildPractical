const prompt = require('prompt-sync')();
const mongo = require('mongodb');
const api = require('./api');
const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient;

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

let screenname;
const mongoUrl = 'mongodb://localhost:27017';

console.log("Welcome to Piper Chat!");

initializeClient()
	.then(displayPeerMenu)
	.catch(console.error);

readline.on('SIGINT', () => {close()});

function initializeClient() {
	//TODO get these values from datastore if they exist in the datastore
	let host = prompt("Enter an IP address for your chat server: ");
	let port = prompt("Enter a port number for your chat server: ");
	screenname = prompt("Enter a screenname: ");
	//TODO save all in datastore

	return api.start(host, port, screenname);
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
	await printOldChatMessages(peer)
		.then(() => {
			process.stdout.write("\n> ");

			readline.on("line", input => {
				process.stdout.write("> ");
				sendMessage(peer, input).then(response => {
					//TODO handle offline peer
				});
			});
			api.apiEvent.on("receiveMessage", response => {
				writeMessageToConsole(response);
				process.stdout.write("\n> ");
			});
		}).catch(console.error);
}

function printOldChatMessages(peer) {
	peerMessages = fetch(`http://${peer.host}:${peer.port}/getMessages/${screenname}`)
		.then(res => res.json());
	clientMessages = new Promise((resolve, reject) => {
		mongo.MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, dbClient) => {
			if(err != null) {
				reject(err);
			}
			let hundredDaysAgo = new Date().getDate()-100;
			dbClient.db(screenname + "_client")
				.collection("messages")
				.find({"sender": peer.username, "timestamp": {$gt: hundredDaysAgo}})
				.limit(100)
				.toArray()
				.then(results => resolve(results));
		});
	});
	return Promise.all([peerMessages, clientMessages]).then((messages) => {
		messages[0].concat(messages[1]).sort((a, b) => {
			a.timestamp - b.timestamp;
		}).forEach(writeMessageToConsole);
	}).catch(console.error);
}

function writeMessageToConsole(message) {
	process.stdout.write("\n" + " " + message.sender + "> " + message.content);
}

function sendMessage(peer, message) {
	let body = {
		sender: screenname,
		timestamp: new Date().getTime(),
		content: message
	}
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
