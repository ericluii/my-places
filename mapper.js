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

module.exports = {
  isCurrentLocation: function(senderID, attachment, callback) {
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

        callback(attachment.title == USERS[senderID].f_name + '\'s Location');
      });
    } else {
      callback(attachment.title == USERS[senderID].f_name + '\'s Location');
    }
  },

  isExistingLocation: function(coordinates, callback) {
    Places.find({
      location: {
        $near: [coordinates.lat, coordinates.long],
        $maxDistance: 5 / 6371 // 5 km / 6371 km <- convert to radians
      }
    }).limit(10).exec(function(err, places) {
      if (err) throw err;

      callback(places);
    });
  }
};
