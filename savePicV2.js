
var mongoose = require('mongoose');
var utils = require('./utils');
var Counter = require('./models/counters.js');

var GridStore = mongoose.mongo.GridStore;
var Grid      = mongoose.mongo.Grid;

var BSON = require('bson').BSONPure;
var ObjectID = BSON.ObjectID;
var dbCount = 0;

function getNextSequence(name) {
	var query = {_id: name};
	var update = {$inc: {seq: 1}};
	var options = {new: true};

	Counter.findByIdAndUpdate(query, update, options, function(err, doc) {
		if(err) {
			console.log('findByIdAndUpdate ERROR ================');
			console.log(err);
		}
		console.log(doc);
		dbCount = doc.seq;
	});

	return dbCount;
}
	
exports.getGridFile = function(id, options, fn) {
	var db = mongoose.connection.db;
	var	options = parse(options);

	id = parseInt(id);
	// {root: 'image'}
	console.log('=============' + options.root);
	var store = new GridStore(db, id, id, "r", {root: options.root});
	store.open(function(err, store) {
		if (err) {
			console.log('getGridFile ERROR ===============');
			console.log(err);

			return fn(err);
		}
		else {
			fn(null, store);
		}
	})
}	

exports.putGridFile = function(buf, name, options, fn) {
	var db = mongoose.connection.db;
	var	options = parse(options);
	options.metadata.filename = name;

	var obj_id = utils.generate_mongoose_object_id('f');

	new GridStore(db, obj_id, name, "w", options).open(function(err, file){
		if (err)
			return fn(err);
		else
			file.write(buf, true, fn);
	});	
}

exports.putGridFileByPath = function(path, name, options, fn) {
	var db = mongoose.connection.db;
	var	options = parse(options);
	options.metadata.filename = name;

	// var obj_id = utils.generate_mongoose_object_id('f');
	var obj_id = getNextSequence("imageid");
	var gridStore = new GridStore(db, obj_id, name, "w", options);

	gridStore.open(function(err, gridStore){
		if (err) {
			return fn(err);
		}	
		else {
			gridStore.writeFile(path, fn);
		}
			
	});
}

exports.deleteGridFile = function(id, options, fn){
	var db= mongoose.connection.db;
	var	options = parse(options);

	id = parseInt(id);
	console.log('Deleting GridFile '+id);

	var	store = new GridStore(db, id, id, 'r', {root: options.root});
	store.unlink(function(err, result){
		if (err) {
			console.log('deleteGridFile ERROR ===================');
			return fn(err);
		}
			
		for (var k in result) {
			console.log(k);
		}
		return fn(null);
	});
}

function parse(options) {
	var opts = {};
	if (options.length > 0) {
		opts = options[0];
	}
	else
		opts = options;

	if (!opts.metadata)
		opts.metadata = {};

	if (!opts.root)
		opts.root = 'image'

	return opts;
}