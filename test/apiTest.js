const assert = require('assert');
const { response } = require('express');
const { default: fetch } = require('node-fetch');
const api = require('../api');
const MongoClient = require('mongodb').MongoClient;

const testHost = "localhost";
const testPort = 5678;
const testUsername = "testUser";
const testUrl = `http://${testHost}:${testPort}`;
const mongoUrl = "mongodb://localhost:27017";

const newPost = {
	sender: "Alice",
	timestamp : new Date().getTime(),
	content : "Hello!"
};
const oldPost = {
	sender: "Alice",
	timestamp : new Date().setTime(1609506000000), //Jan 1st, 2021
	content : "This is an old message from over 30 days ago"
};
const bobPost = {
	sender: "Bob",
	timestamp : new Date().getDate(),
	content : "This is a post from Bob, not Alice"
};
const recievedMessage = {
	sender: "Sally",
	timestamp : new Date().getDate(),
	content : "Sally will send this message to the client"
};

describe("Running API endpoints", function() {
	this.beforeAll(async function() {
		//initialize database with old messages
		await new Promise((resolve, reject) => {
				MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, async (err, client) => {
					if(err != null) {
						reject(err);
					}
					let allPosts = [oldPost, bobPost, newPost].concat(_randomPosts(115));
					await client.db(testUsername + "_testClient")
						.collection("messages")
						.insertMany(allPosts, {writeConcern : {w:1}})
						.catch(console.error);
					await client.close();
					resolve();
			});
		});
		Promise.resolve(api.start(testHost, testPort, testUsername));
	});

	describe("/getStatus", async function() {
		let fetchPromise;
		before(function() {
			fetchPromise = fetch(testUrl + "/getStatus");
			return fetchPromise;
		});
        it("should be live", async function() {
			await fetchPromise
				.then(response => assert(response.ok))
				.catch(console.error);
        });
		it("should respond with the username at this endpoint", async function() {
			await fetch(testUrl + "/getStatus")
				.then(response => response.text())
				.then(responseUsername => {
					assert.strictEqual(responseUsername, testUsername);
				})
				.catch(assert.fail);
		});
	});

	describe("/recieveMessage", async function() {
		let fetchResult;
		before(async function() {
			fetchResult = await fetch(testUrl + "/recieveMessage", {
				method: "POST",
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(recievedMessage)
			});
			return fetchResult;
		});
		it("stores the new message in the database", async function(){
			MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
				.then(client => client.db(testUsername + "_testClient")
					.collection("messages")
					.findOne({sender:recievedMessage.sender}))
				.then(result => assert.notStrictEqual(result, null))
				.catch(assert.fail);
		});
		it("Returns a status indicating the message was recieved", async function(){
			fetchResult.text()
				.then(resultText => assert.strictEqual(resultText, "Message recieved"));
		});
	});

	after(async function() {
		//clear the test database
		await MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
			.then(client => client.db(testUsername + "_testClient").dropDatabase());
	});
});

function _randomPosts(numPosts) {
	postArray = [];
	for(var i=0; i<numPosts; i++) {
		postArray.push({
			sender: "Alice",
			timestamp : new Date().getTime(),
			content : "My favorite random number is" + Math.random()
		});
	}
	return postArray;
}
