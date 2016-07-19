/********************************************************
 * Caching singleton
 ********************************************************/

// Init
const USER_STATE_KEY = "USER_STATE_KEY";
global[USER_STATE_KEY] = {};

const USERS_KEY = "USERS_KEY";
global[USERS_KEY] = {};

const USER_LOCATION_KEY = "USER_LOCATION_KEY";
global[USER_LOCATION_KEY] = {};

// Define singleton
var cache = {};

Object.defineProperty(cache, "states", {
  get: function() { return global[USER_STATE_KEY]; }
});

Object.defineProperty(cache, "users", {
  get: function() { return global[USERS_KEY]; }
});

Object.defineProperty(cache, "locations", {
  get: function() { return global[USER_LOCATION_KEY]; }
});

// Ensure api isn't changed
Object.freeze(cache);

// Export cache api
module.exports = cache;
