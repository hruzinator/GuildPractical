const prompt = require('prompt-sync')();
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
	.then(addPeer)
	.then(connectToPeer)
	.catch(console.error);

readline.on('SIGINT', () => {close()});

function initializeClient() {
	let host = prompt("Enter an IP address for your chat server: ");
	let port = prompt("Enter a port number for your chat server: ");
	screenname = prompt("Enter a screenname: ");

	return api.start(host, port, screenname);
}

async function addPeer() {
	let peerHost = await new Promise((resolve, _reject) => {
		readline.question("Enter an IP address for the remote chat user: ", resolve);
	});
	let peerPort = await new Promise((resolve, _reject) => {
		readline.question("Enter a port number for the remote chat user: ", resolve);
	});

	return fetch(`http://${peerHost}:${peerPort}/getStatus`)
		.then(response => response.text())
		.then(username => {
			return Promise.resolve({"username" : username, "host" : peerHost, "port" : peerPort});
		})
		.then(peer => {
			console.log("Connected with " + peer.username);
			return Promise.resolve(peer);
		})
		.catch((err) => {
			if(err.code == "ECONNREFUSED") {
				console.log(`It does not appear that a chat client is running at ${peerHost}:${peerPort}, ` 
					+ `or there is something preventing you from reaching this connection`);
				console.log("Check the parameters and try again.");
			}
			throw new Error(err);
		});
}

async function connectToPeer(peer) {
	console.log("Now chatting with " + peer.username + ". Type Control+C to quit");
	await printOldChatMessages(peer)
		.then(() => {
			process.stdout.write("\n> ");

			readline.on("line", input => {
				process.stdout.write("> ");
				sendMessage(peer, input);
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
		MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, dbClient) => {
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
	return Promise.all([peerMessages, clientMessages])
		.then((messages) => {
			messages[0].concat(messages[1]).sort((a, b) => {
				return a.timestamp - b.timestamp;
			}
			).forEach(writeMessageToConsole);
		})
		.catch(console.error);
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
