/********************************************************
 * Handles actual app specific logic
 ********************************************************/
var cache = require('./cache');
var mapper = require('./mapper');
var sync = require('sync-request');

// Global Cache
var CURRENT_STATES = cache.states;
var CURRENT_LOCATIONS = cache.locations;

// States
const STATE_NULL = 0,
      STATE_CREATE_CONFIRM = 1,
      STATE_NEW_PLACE_SET_TITLE = 2,
      STATE_NEW_PLACE_SET_CATEGORY = 3,
      STATE_MULTI_SEARCH_RESPONSE = 4,
      STATE_PLACE_EDIT = 5;

// Modulize functions
function FOUR_OH_FOUR(senderID, message, marshal) {
  var res = sync('GET', 'http://numbersapi.com/random/');
  var body = res.getBody('utf8');
  marshal.sendTextMessage(senderID, message + " Did you know that " + body);
}

// Basic Handler export code
var HANDLERS = {};
module.exports = {
  receivedMessageHandler: function(message, marshal) {
    if (!(message.senderID in CURRENT_STATES)) {
      CURRENT_STATES[message.senderID] = STATE_NULL;
    }

    HANDLERS[CURRENT_STATES[message.senderID]](message, marshal);
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
        CURRENT_LOCATIONS[message.senderID] = location;

        if (!potential_locations || !potential_locations.length) {
          CURRENT_STATES[message.senderID] = STATE_CREATE_CONFIRM;

          // Confirm creation
          marshal.sendQuickResponse(
            message.senderID,
            "Would you like me to remember this location?[" + location.title + "]",
            [
              {
                content_type: "text",
                title: "Yes Please!",
                payload: message.senderID
              },
              {
                content_type: "text",
                title: "No Thank You!",
                payload: -1
              }
            ]
          );
        } else {
          CURRENT_STATES[message.senderID] = STATE_MULTI_SEARCH_RESPONSE;

          var location_replies = [];
          for(var i = 0; i < potential_locations.length; i++) {
            location_replies.push(
              {
                content_type: "text",
                title: potential_locations[i].name,
                payload: potential_locations[i]._id.toString()
              }
            );
          }

          location_replies.push(
            {
              content_type: "text",
              title: "Create a New Place!",
              payload: message.senderID
            }
          );

          marshal.sendQuickResponse(
            message.senderID,
            "Locations nearby. Which do you want to edit?",
            location_replies
          );
        }
      });
    }
  }
}

HANDLERS[STATE_CREATE_CONFIRM] = function(message, marshal) {
  if (!message.contents.quick_reply) {
    FOUR_OH_FOUR(message.senderID, "All you had to do was press a button... Aborting.", marshal);
    CURRENT_STATES[message.senderID] = STATE_NULL;
  } else {
    if (message.contents.quick_reply.payload != -1) {
      mapper.addLocation(message.senderID, CURRENT_LOCATIONS[message.senderID], function(place) {
        mapper.isCurrentLocation(message.senderID, CURRENT_LOCATIONS[message.senderID], function(isCurrentLocation) {
          if (isCurrentLocation) {
            marshal.sendTextMessage(message.senderID, 'Successfully created location. What would you like to name this place?');
            CURRENT_STATES[message.senderID] = STATE_NEW_PLACE_SET_TITLE;
          } else {
            marshal.sendTextMessage(message.senderID, 'What category of place is this location?');
            CURRENT_STATES[message.senderID] = STATE_NEW_PLACE_SET_CATEGORY;
          }
        });
      });
    } else {
      marshal.sendTextMessage(message.senderID, "Okay (: I won't! Have a nice day.");
      CURRENT_STATES[message.senderID] = STATE_NULL;
    }

    CURRENT_STATES[message.senderID] = STATE_NULL;
  }
}

HANDLERS[STATE_NEW_PLACE_SET_TITLE] = function(message, marshal) {
  marshal.sendTextMessage(message.senderID, 'Title');
  CURRENT_STATES[message.senderID] = STATE_NULL;
}

HANDLERS[STATE_NEW_PLACE_SET_CATEGORY] = function(message, marshal) {
  marshal.sendTextMessage(message.senderID, 'Category');
  CURRENT_STATES[message.senderID] = STATE_NULL;
}

HANDLERS[STATE_MULTI_SEARCH_RESPONSE] = function(message, marshal) {
  marshal.sendTextMessage(message.senderID, 'Multi Search Response');
  CURRENT_STATES[message.senderID] = STATE_NULL;
}
