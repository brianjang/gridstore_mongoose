var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var counterSchema = new Schema({
	_id: String,
	seq: Number
});

module.exports = mongoose.model('counter', counterSchema);