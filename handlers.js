/********************************************************
 * Handles actual app specific logic
 ********************************************************/
var cache = require('./cache');
var mapper = require('./mapper');

// States
const STATE_NULL = 0,
      STATE_ENTRY_FOUND = 1;

// Function Dictionary for each state
var HANDLERS = {};

// Current User States - Use the singleton
var CURRENT_STATES = cache.states;

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
    if (mapper.isCurrentLocation(message.senderID, message.contents.attachments[0])) {
      marshal.sendTextMessage(message.senderID, "Received your current location (:");
    } else {
      marshal.sendTextMessage(message.senderID, "Thanks for telling me about " + message.contents.attachments[0].title);
    }
  }
}
