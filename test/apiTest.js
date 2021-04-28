const assert = require('assert');
const api = require('../api');

//TODO test database

describe("Running API endpoints", function() {
	before(function() {
		//TODO set up client and peer
		
	});
	
	describe("/getStatus", function() {
        it("should be live", function() { 
            assert.equal(1, 1);
        });
	});

	describe("/getMessages", function() {

	});

	describe("/recieveMessage", function() {

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

