const MongoClient = require('mongodb').MongoClient;
const express = require('express');
var bodyParser = require('body-parser');

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const apiEvent = new MyEmitter();

const app = express();

let username, dbClient, db;
const listenerFunctions = [];
const mongoUrl = 'mongodb://localhost:27017';

app.use(express.json());

app.get('/getStatus', (req, res) => {
	console.log("in getStatus. Username is: " + username);
	res.status(200).send(username);
});

app.get('/getMessages/:user', (req, res) => {
	//collection.deleteMany()
	//TODO limit 100 and last 30 days
	// let messages = db.collection("messages").findMany({"sender":username});
	res.send(req.params.user);
});

app.post('/receiveMessage', (req, res) => {
	//request exists here, but request.body does not for some reason
	// db.collection("messages").insertOne(req.body);
	apiEvent.emit("receiveMessage", req.body);
	res.status(200).send("Message recieved");
});

/**
 * Dependency-inject event emitters
 */
function addMessageListener(listener) {
	return Promise.resolve(listenerFunctions.push(listener));
}

function start(hostname, port, uname) {
	username = uname;
	databaseConnectionPromise = new Promise((resolve, reject) => {
		dbClient = new MongoClient(mongoUrl, {useUnifiedTopology:true});
		dbClient.connect(function(err) {
			if(err != null) {
				reject(err);
			}
			console.log("database connection established");
			db = dbClient.db(username + "_client");
			resolve();
		});
	});
	chatServerPromise = new Promise((resolve, reject) => {
		app.listen(port, hostname, () => {
			console.log(`Chat server listening at http://${hostname}:${port}`);
			resolve();
		});
	});
	return Promise.all([databaseConnectionPromise, chatServerPromise]);
}

process.on("exit", (exitCode) => {
	if(dbClient != null) {
		dbClient.close();
	}
});

exports.start = start;
exports.addMessageListener = addMessageListener;
exports.apiEvent = apiEvent;
