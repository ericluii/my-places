/********************************************************
 * Caching singleton
 ********************************************************/

// Init
const USER_STATE_KEY = "USER_STATE_KEY";
global[USER_STATE_KEY] = {};

const USERNAME_KEY = "USERNAME_KEY";
global[USERNAME_KEY] = {};

// Define singleton
var cache = {};

Object.defineProperty(cache, "states", {
  get: function() { return global[USER_STATE_KEY]; }
});

Object.defineProperty(cache, "usernames", {
  get: function() { return global[USERNAME_KEY]; }
});

// Ensure api isn't changed
Object.freeze(cache);

// Export cache api
module.exports = cache;
