/********************************************************
 * Functions for dealing with actual map locations
 ********************************************************/
var cache = require('./cache');
var sync = require('sync-request');

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
// Username Info - Use singleton
var USERNAMES = cache.usernames;

module.exports = {
  isCurrentLocation: function(senderID, attachment) {
    if (!(senderID in USERNAMES)) {
      var res = sync('GET', 'https://graph.facebook.com/v2.6/' + senderID + '?fields=first_name&access_token=' + PAGE_ACCESS_TOKEN);
      var body = JSON.parse(res.getBody('utf8'));
      USERNAMES[senderID] = body.first_name;
    }

    // ex. Eric's Location
    return attachment.title == USERNAMES[senderID] + '\'s Location';
  }
};
