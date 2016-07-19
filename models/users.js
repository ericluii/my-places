var mongoose = require('mongoose');

var usersSchema = mongoose.Schema({
  id: Number,
  f_name: String,
  l_name: String,
  is_admin: Boolean
});

module.exports = mongoose.model('Users', usersSchema);
