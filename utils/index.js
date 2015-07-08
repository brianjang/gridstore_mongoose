module.exports.generate_mongoose_object_id = function(prefix) {
	var mongoose = require('mongoose');
	var id = mongoose.Types.ObjectId();
	return prefix + String(id);
}