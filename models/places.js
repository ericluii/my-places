var mongoose = require('mongoose');

var placesSchema = mongoose.Schema({
  name: String,
  url: String,
  location: {
    type: [Number],  // [<longitude>, <latitude>]
    index: '2d'
  },
  creator: String,
  photos: [String],
  notes: [String],
  is_interested: Boolean,
  is_deleted: Boolean
});

module.exports = mongoose.model('Places', placesSchema);
