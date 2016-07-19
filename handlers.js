/********************************************************
 * Handles actual app specific logic
 ********************************************************/
var cache = require('./cache');
var mapper = require('./mapper');
var sync = require('sync-request');

// States
const STATE_NULL = 0,
      STATE_ENTRY_FOUND = 1;

// Function Dictionary for each state
var HANDLERS = {};

// Current User States - Use the singleton
var CURRENT_STATES = cache.states;

function FOUR_OH_FOUR(senderID, message, marshal) {
  var res = sync('GET', 'http://numbersapi.com/random/');
  var body = res.getBody('utf8');
  marshal.sendTextMessage(senderID, message + " Did you know that " + body);
}

module.exports = {
  receivedMessageHandler: function(message, marshal) {
    if (!(message.senderID in CURRENT_STATES)) {
      CURRENT_STATES[message.senderID] = STATE_NULL;
    }

    HANDLERS[STATE_NULL](message, marshal);
  },

  receivedPostbackHandler: function(message, marshal) {
    marshal.sendTextMessage(message.senderID, "Postback called");
  }
}

// Setup State Machine Handlers
HANDLERS[STATE_NULL] = function(message, marshal) {
  if (message.contents.text) {
    marshal.sendTextMessage(message.senderID, message.contents.text);
  } else if (message.contents.attachments) {
    var location = message.contents.attachments[0];

    // Verify we are working with a location
    if (location.type != "location") {
      FOUR_OH_FOUR(message.senderID, "Wait... this isn't a place.", marshal);
    } else {
      mapper.isExistingLocation(location.payload.coordinates, function(potential_locations) {
        if (!potential_locations || !potential_locations.length) {
          marshal.sendTextMessage(message.senderID, "No location known nearby");
          // Create new location?
        } else if (potential_locations.length == 1) {
            marshal.sendTextMessage(message.senderID, "One location nearby");
            // Is this the location? or create a new one
        } else {
            marshal.sendTextMessage(message.senderID, "Received your current location (:");
            // Are any of these the location? or create a new one
        }
      });
    }
  }
}
