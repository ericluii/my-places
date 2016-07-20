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

// DO NOT CHANGE VALUES.
// THIS IS ENCODED IN THE DB.
// I WILL LITERALLY KILL YOU.
const CATEGORIES = {
  1: 'Restaurant',
  2: 'Cafe',
  9999: 'Other'
};

// Build the category question once.
var category_replies = [];
for (var key in CATEGORIES) {
  category_replies.push({
    content_type: "text",
    title: CATEGORIES[key],
    payload: key
  });
}

// Modulize functions
function FOUR_OH_FOUR(senderID, message, marshal) {
  var res = sync('GET', 'http://numbersapi.com/random/');
  var body = res.getBody('utf8');
  marshal.sendTextMessage(senderID, message + " Did you know that " + body);
}

function ask_for_category(senderID, marshal) {
  marshal.sendQuickResponse(senderID, 'What category of place is this location?', category_replies);
  CURRENT_STATES[senderID] = STATE_NEW_PLACE_SET_CATEGORY;
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
          // A title can be maximum 20 characters long
          for(var i = 0; i < potential_locations.length; i++) {
            location_replies.push(
              {
                content_type: "text",
                title: potential_locations[i].name.substring(0, 20),
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
      mapper.addLocation(message.senderID, function(place) {
        mapper.isCurrentLocation(message.senderID, function(isCurrentLocation) {
          if (isCurrentLocation) {
            marshal.sendTextMessage(message.senderID, 'Successfully created location. What would you like to name this place?');
            CURRENT_STATES[message.senderID] = STATE_NEW_PLACE_SET_TITLE;
          } else {
            ask_for_category(message.senderID, marshal);
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

HANDLERS[STATE_MULTI_SEARCH_RESPONSE] = function(message, marshal) {
  if (!message.contents.quick_reply) {
    FOUR_OH_FOUR(message.senderID, "All you had to do was press a button... Aborting.", marshal);
    CURRENT_STATES[message.senderID] = STATE_NULL;
  } else {
    if (message.contents.quick_reply.payload != -1) {
      mapper.addLocation(message.senderID, function(place) {
        mapper.isCurrentLocation(message.senderID, function(isCurrentLocation) {
          if (isCurrentLocation) {
            marshal.sendTextMessage(message.senderID, 'Successfully created location. What would you like to name this place?');
            CURRENT_STATES[message.senderID] = STATE_NEW_PLACE_SET_TITLE;
          } else {
            ask_for_category(message.senderID, marshal);
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

// From the point on, the non smart location object
// in CURRENT_LOCATIONS is now an instance of the mongoose location object
// this means we can arbitrarily call save() and good things happen
// for all code below this point.

HANDLERS[STATE_NEW_PLACE_SET_TITLE] = function(message, marshal) {
  if (message.contents.text) {
    CURRENT_LOCATIONS[message.senderID].name = message.contents.text;
    CURRENT_LOCATIONS[message.senderID].save(function (err) {
      if (err) throw err;

      marshal.sendTextMessage(message.senderID, 'Saved name as \'' + message.contents.text + '\'.');
    });

    ask_for_category(message.senderID, marshal);
  } else {
    marshal.sendTextMessage(message.senderID, 'Instructions unclear? Too bad. I want a title not a pug gif.');
  }
}

HANDLERS[STATE_NEW_PLACE_SET_CATEGORY] = function(message, marshal) {
  if (!message.contents.quick_reply) {
    marshal.sendTextMessage(message.senderID, "All you had to do was press a button...Let's try this again.", function() {
      ask_for_category(message.senderID, marshal);
    });
  } else {
    CURRENT_LOCATIONS[message.senderID].category = message.contents.quick_reply.payload;
    CURRENT_LOCATIONS[message.senderID].save(function (err) {
      if (err) throw err;

      marshal.sendTextMessage(
        message.senderID,
        'Saved category as \'' + CATEGORIES[message.contents.quick_reply.payload] + '\'.',
        function() {
          marshal.sendTextMessage(message.senderID, 'Thanks for telling me about this place!');
        });
    });

    CURRENT_STATES[message.senderID] = STATE_NULL;
  }
}
