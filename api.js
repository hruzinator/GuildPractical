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
	console.log("in getStatus. Username is: " + username);
	res.status(200).send(username);
});

app.get('/getMessages/:user', (req, res) => {
	//collection.deleteMany()
	//TODO limit 100 and last 30 days
	MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, dbClient) => {
		//TODO handle error
		//TODO this is a cursor object. Need to fish out actual data
		dbClient.db(username + "_client")
			.collection("messages")
			.find()
			.toArray()
			.then(results => res.send(JSON.stringify(results)));
	});
});

app.post('/receiveMessage', (req, res) => {
	db.collection("messages").insertOne(req.body);
	apiEvent.emit("receiveMessage", req.body);
	res.status(200).send("Message recieved");
});

function start(hostname, port, uname) {
	username = uname;
	return new Promise((resolve, reject) => {
		app.listen(port, hostname, () => {
			console.log(`Chat server listening at http://${hostname}:${port}`);
			resolve();
		});
	});
}

exports.start = start;
exports.apiEvent = apiEvent;
