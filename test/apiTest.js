const assert = require('assert');
const api = require('../api');

//TODO test database

describe("Running API endpoints", function() {
	before(function() {
		//TODO set up client and peer
		api.start();
	});
	
	describe("/getStatus", function() {
        it("should be live", function() { 
            
        });
	});

	describe("/getMessages", function() {

	});

	describe("/recieveMessage", function() {
		it("should return messages", function() {

		});
		it("should filter out messages older than 30 days", function() {

		});
		it("should limit results to 100 messages", function() {

		});
	});
});

describe("Peer not online", function() {
	before(function() {
		//TODO set up client only
	});
	describe("/getStatus", function() {
		it("should refuse the connection", function() {

		});
	});
});

