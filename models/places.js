var mongoose = require('mongoose');

var placesSchema = mongoose.Schema({
  name: String,
  category: Number,
  url: String,
  location: {
    type: [Number],  // [<longitude>, <latitude>]
    index: '2d'
  },
  creator: String,
  photos: [String],
  notes: [String],
  memories: [String],
  is_confirmed: Boolean,
  is_deleted: Boolean
});

module.exports = mongoose.model('Places', placesSchema);
