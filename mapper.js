/********************************************************
 * Functions for dealing with actual map locations
 ********************************************************/
var cache = require('./cache');
var sync = require('sync-request');
var mongoose = require('mongoose');
var Users = require('./models/users');
var Places = require('./models/places');

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
// Username Info - Use singleton
var USERS = cache.users;
var CURRENT_LOCATIONS = cache.locations;

module.exports = {
  isCurrentLocation: function(senderID, callback) {
    var location = CURRENT_LOCATIONS[senderID];

    // Check if it is a moved pin
    if (location.name == 'Pinned Location') {
      callback(true);
      return;
    }

    if (!(senderID in USERS)) {
      Users.find(
        { id: senderID }
      ).exec(function(err, users) {
        if (err) throw err;

        if (!users.length) {
          var res = sync('GET', 'https://graph.facebook.com/v2.6/' + senderID + '?fields=first_name,last_name&access_token=' + PAGE_ACCESS_TOKEN);
          var body = JSON.parse(res.getBody('utf8'));

          var user = new Users({
            id: senderID,
            f_name: body.first_name,
            l_name: body.last_name,
            is_admin: false
          });
          user.save();

          USERS[senderID] = user;
          console.log('Registered New User: %s %s[%d]', user.f_name, user.l_name, user.id);
        } else {
          USERS[senderID] = users[0];
        }

        callback(location.name == USERS[senderID].f_name + '\'s Location');
      });
    } else {
      callback(location.name == USERS[senderID].f_name + '\'s Location');
    }
  },

  isExistingLocation: function(coordinates, callback) {
    Places.find({
      location: {
        $near: [coordinates.long, coordinates.lat],
        $maxDistance: 5 / 111.12 // 111.11999965975954 km / degree  ie. 2 km radius
      }

    // Limit of 9 is because Quick Replies is capped at 10
    // we need 1 for the option of creating a new location
    }).limit(9).exec(function(err, places) {
      if (err) throw err;

      callback(places);
    });
  },

  addLocation: function(senderID, callback) {
    var location = CURRENT_LOCATIONS[senderID];

    var place = new Places({
      name: location.title,
      category: -1,
      url: location.url,
      location: [location.payload.coordinates.long, location.payload.coordinates.lat],
      creator: senderID,
      photos: [],
      notes: [],
      is_confirmed: false,
      is_deleted: false
    });

    place.save(function (err) {
      if (err) throw err;

      callback(place);
    });

    CURRENT_LOCATIONS[senderID] = place;
  }
};
