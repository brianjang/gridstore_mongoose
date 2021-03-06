var fs = require('fs');
var async = require('async');
var mongoose = require('mongoose');

var GridStore = mongoose.mongo.GridStore;
// var Grid      = mongoose.mongo.Grid;

var baseCnt = 0;
var prefix = 'f';
var grid_root = 'files';

var image_folder = 'bgImage';
var fileExtType = {
	"jpg": "image/jpeg",
	"png": "image/png"
}

getFileExt = function (dir_path) {
			var i = dir_path.lastIndexOf('.');
			return (i < 0) ? '' : [dir_path.substr(i), i];
		};

getContentType = function (ext) {
	return fileExtType[ext.toLowerCase()];
}

realpathSync = function(dir_path) {
	return fs.realpathSync(dir_path);
}

makeDirSync = function(dir_path) {
	if (!fs.existsSync(dir_path)){
		fs.mkdirSync(dir_path);
	};
};

readDirSync = function(dir_path) {
	// return fs.readdirSync(dir_path);

	var imageList = fs.readdirSync(dir_path);
	for (var i=0; i < imageList.length; i++) {
		fileExt = getFileExt(imageList[i]);
		mimeType = getContentType(fileExt[0].substr(1));
		
		if (typeof mimeType === 'undefined') { //remove hidden files
			imageList.splice(i, 1);
		}
	}

	return imageList;
}


renameSync = function(path, fileLsit, baseCnt) {
	// return fs.renameSync(oldPath, newPath);

	// var baseCnt = baseCnt;
	for(var i=baseCnt; i < fileLsit.length + baseCnt; i++) {
		fileExt = getFileExt(fileLsit[i - baseCnt]);
		fs.renameSync(path + fileLsit[i-baseCnt], path + i.toString() + fileExt[0]);
	}
}

// var options = [{content_type: req.files.file.mimetype}];
putGridFileByPath = function(path, obj_id, name, options, fn) {
	var db = mongoose.connection.db;
	var	options = parse(options);
	options.metadata.filename = name;

	// var obj_id = utils.generate_mongoose_object_id('f');
	// imageList[i].substr(0, fileExt[1])
	var obj_id = obj_id;
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

function parse(options) {
	var opts = {};
	if (options.length > 0) opts = options[0];
	else opts = options;

	if (!opts.metadata) opts.metadata = {};

	if (!opts.root) opts.root = grid_root;

	return opts;
}

connectMongoose = function(callback) {
	var mongoLocal = 'mongodb://localhost:14000/sideview'
	mongoose.connect(mongoLocal, function(err) {
		if(err) {
			console.log('connection error', err);
			callback({ret: -1});
		} else {
			console.log('connection successful');
			callback({ret: 0});
		}
	});
}

generate_mongoose_object_id = function(prefix) {
	var id = mongoose.Types.ObjectId();
	return prefix + String(id);
}

// change object id like fxxxxx
imageUpload_V4 = function() {
	var fileExt = '';
	var dirPath = '';
	var mimeType = '';
	var options = [];
	
	var imageList = [];

	async.waterfall([
			function(callback) {
				connectMongoose(function(data) {
					console.log(data);
					if(data.ret !== 0) {
						throw new Error('fail connect db');
					};
					callback(null, data);
				});
			},
			function(data, callback) {
				makeDirSync(image_folder);
				dirPath = realpathSync(image_folder) + '/';
				imageList = readDirSync(image_folder);
				callback(null, imageList);
			},
			function(imageList,callback) {
				var ret = [];

				function done(err) {
					if(err) throw err;
					callback(null, ret);
				}
				function iterator (imageList, callback) {
					fileExt = getFileExt(imageList);
					mimeType = getContentType(fileExt[0].substr(1));

					options = [{content_type: mimeType}];
					// path, obj_id, name, options, fn
					putGridFileByPath(dirPath + imageList, 
									generate_mongoose_object_id(prefix), 
									imageList, 
									options, 
									function(err, result) {
										if(err) {
											console.log('db write error');
											throw err;
										};

										ret.push(result);

										callback(null, result);
									});
				}
				async.forEach(imageList, iterator, done);
			}
		],
		function(err, result) {
			console.log('----------------------');
			console.log('[result] ================');
			console.log(result.length);
			// result.forEach(function(elem) {
			// 	console.log(elem.options);
			// 	console.log(elem.fileId);
			// 	console.log(elem.filename);
			// 	console.log(elem.contentType);
			// });


			process.exit();
		});
};

// use theme.js
imageUpload_V3 = function() {
	var theme = require('./theme')
	var fileExt = '';
	var dirPath = '';
	var mimeType = '';
	var options = [];
	
	var imageList = [];

	async.waterfall([
			function(callback) {
				connectMongoose(function(data) {
					console.log(data);
					if(data.ret !== 0) {
						throw new Error('fail connect db');
					};

					callback(null, data);
				});
			},
			function(data, callback) {
				dirPath = realpathSync(theme.dir) + '/';				
				imageList = readDirSync(theme.dir);
				callback(null, imageList);
			},
			function(imageList,callback) {
				function done(err) {
					if(err) throw err;
					callback(null, imageList);
				}
				function iterator (imageList, callback) {
					var obj_id = 0;
					fileExt = getFileExt(imageList);
					mimeType = getContentType(fileExt[0].substr(1));

					// find image id with imageList from theme
					var themeList = theme.image;
					for(var i=0; i < themeList.length; i++) {
						
						if(themeList[i].name == imageList) {
							obj_id = themeList[i].id;
							console.log('break');
							break;
						}
					}

					options = [{content_type: mimeType}];
					// path, obj_id, name, options, fn
					putGridFileByPath(dirPath + imageList, 
									obj_id, 
									imageList, 
									options, 
									function(err, result) {
										console.log('---------------------');
										console.log(result.options);
										console.log(result.fileId);
										console.log(result.filename);
										console.log(result.contentType);
										if(err) {
											console.log('db write error');
											throw err;
										}

										callback(null, result.filename);
									});
				}
				async.forEach(imageList, iterator, done);
			}
		],
		function(err, result) {
			console.log('----------------------');
			console.log('[result] ================');
			console.log(result);


			process.exit();
		});
};

imageUpload_V1 = function() {
	var fileExt = '';
	var dirPath = '';
	var mimeType = '';
	var options = [];
	var baseCnt = 0;

	connectMongoose(function(data) {
		console.log(data);
		if (data.ret === 0) {
			console.log('now we can start');

			makeDirSync(image_folder);

			dirPath = realpathSync(image_folder) + '/';
			console.log(dirPath);

			
			var imageList = readDirSync(image_folder);
			renameSync(dirPath, imageList, baseCnt);

			// upload image 
			imageList = readDirSync(image_folder);
			for(var i=0; i < imageList.length; i++) {
				fileExt = getFileExt(imageList[i]);
				mimeType = getContentType(fileExt[0].substr(1));

				options = [{content_type: mimeType}];
				putGridFileByPath(dirPath + imageList[i], imageList[i].substr(0, fileExt[1]), imageList[i], options, function(err, result) {
					console.log('---------------------');
					console.log('result.options' + result.options.toString());
					console.log(result.fileId);
					console.log(result.filename);
					console.log(result.contentType);

					process.exit();
				});
				
			}
		}
	});
};

imageUpload_V2 = function() {
	var fileExt = '';
	var dirPath = '';
	var mimeType = '';
	var options = [];
	
	var imageList = [];

	async.waterfall([
			function(callback) {
				connectMongoose(function(data) {
					console.log(data);
					if(data.ret !== 0) {
						throw new Error('fail connect db');
					};

					callback(null, data);

				})
			},
			function(data, callback) {
				console.log('----------------------');
				console.log(data);
				makeDirSync(image_folder);

				dirPath = realpathSync(image_folder) + '/';
				console.log(dirPath);

				
				imageList = readDirSync(image_folder);
				renameSync(dirPath, imageList, baseCnt);

				// upload image 
				imageList = readDirSync(image_folder);
				callback(null, imageList);
			},
			function(imageList,callback) {
				console.log('----------------------');
				console.log(imageList);

				function done(err) {
					if(err) throw err;
					callback(null, imageList);
				}
				function iterator (imageList, callback) {
					fileExt = getFileExt(imageList);
					mimeType = getContentType(fileExt[0].substr(1));

					options = [{content_type: mimeType}];
					putGridFileByPath(dirPath + imageList, imageList.substr(0, fileExt[1]), imageList, options, function(err, result) {
						console.log('---------------------');
						console.log(result.options);
						console.log(result.fileId);
						console.log(result.filename);
						console.log(result.contentType);
						if(err) {
							console.log('db write error');
							throw err;
						}

						callback(null, result.filename);
					});
				}
				async.forEach(imageList, iterator, done);
			}
		],
		function(err, result) {
			console.log('----------------------');
			console.log('[result] ================');
			console.log(result);


			process.exit();
		});
};




// imageUpload_V1();
// imageUpload_V2();
// imageUpload_V3();
imageUpload_V4();