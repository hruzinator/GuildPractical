const MongoClient = require('mongodb').MongoClient;
const express = require('express');

const EventEmitter = require('events');
class MyEmitter extends EventEmitter { }
const apiEvent = new MyEmitter();

const app = express();

let username;
const mongoUrl = 'mongodb://localhost:27017';

app.use(express.json());

app.get('/getStatus', (req, res) => {
	res.status(200).send(username);
});

app.get('/getMessages/:user', (req, res) => {
	MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, dbClient) => {
		if(err != null) {
			res.send(500);
		}
		//subtract one month in Unix time (milliseconds)
		let thirtyDaysAgo = new Date().getTime() - 2592000000;
		dbClient.db(username + "_client")
			.collection("messages")
			.find({"sender": req.params.user, "timestamp": {$gt: thirtyDaysAgo}})
			.limit(100)
			.toArray()
			.then(results => res.send(JSON.stringify(results)))
			.catch(err => res.status(500).send(err));
	});
});

app.post('/receiveMessage', (req, res) => {
	MongoClient.connect(mongoUrl, { useUnifiedTopology: true}, (err, dbClient) => {
		dbClient.db(username + "_client")
			.collection("messages")
			.insertOne(req.body)
			.catch(console.error);
		apiEvent.emit("receiveMessage", req.body);
		res.status(200).send("Message recieved");
	});
});

function start(hostname, port, uname) {
	username = uname;
	return new Promise((resolve, _reject) => {
		app.listen(port, hostname, () => {
			console.log(`Chat server listening at http://${hostname}:${port}`);
			resolve();
		});
	});
}

exports.start = start;
exports.apiEvent = apiEvent;
