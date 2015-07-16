var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var formidable = require('formidable')
var Schema = mongoose.Schema;
var multer  = require('multer');
var savepicv2 = require('./savePicV2');
var utils = require('./utils');
var Counter = require('./models/counters.js');
var errorHandler = require('./middleware/errorHandlers');
var log = require('./middleware/logger');



var mongoLocal = 'mongodb://localhost:14000/upload_test'
mongoose.connect(mongoLocal, function(err) {
    if(err) {
        console.log('connection error', err);
    } else {
        console.log('connection successful');
    }
});


var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({ dest: './uploads/'}));
app.use(log.logger);

function displayKey(obj) {
	for (var k in obj) {
		console.log(k);
		// console.log(obj[k]);
	}
}


app.get('/', function(req, res) {
	var data = {};
	var count = 0;
	Counter.count(function(err, doc){
		if(err) {
			console.log(err);
			next(err);
		}
		count = doc;

		if(count === 0) {
			data['_id'] = 'imageid';
			data['seq'] = 0;
			Counter.create(data, function(err, doc){
				if(err) {
					console.log(err);
					next(err);
				}
			});
		}
	});

	res.render('index', {title: 'Upload background image'});
});


app.post("/upload", function(req, res) {
	var options = [{content_type: req.files.file.mimetype}];

	savepicv2.putGridFileByPath(req.files.file.path, req.files.file.originalname /*file.filename*/, options, function(err, result) {
		return res.redirect('/');
	});
});

app.post("/upload2", function(req, res) {
	var form = new formidable.IncomingForm();
	// var options = [{content_type: req.files.file.mimetype}];
	var options = [];

	form.parse(req, function(err, fields, files) {

		if (err) {
			console.log(err);
			res.send('meet error');
		}

		// buf, name, options, fn
		savepicv2.putGridFileByPath(files.file.path, files.file.name /*file.filename*/, options, function(err, result) {
			res.redirect('/');
		});

	});

	form.on('progress', function(bytesReceived, bytesExpected) {

		var percent = (bytesReceived / bytesExpected * 100) | 0;

	});

	form.on('error', function(err) {
		console.log('ERROR ============');
		console.log(err);
		res.writeHead(400, {'content-type': 'text/plain'}); // 400: Bad Request
	});
});


// rendering file image to browser
app.get("/file/:id", function(req, res, next) {
	var options = []
	return savepicv2.getGridFile(req.params.id, options, function(err, store) {
		if (err) {
			console.log('get file error ===============');
			console.log(err);
			next(new Error('can not get file '));
		}

		res.header("Content-Type", store.contentType);
		
		// res.writeHead(200, {'Content-Type': store.contentType});
		
		return store.stream(true).pipe(res);
		// store.stream(true).pipe(res);
		// store.read(function(err, data) {
		// 	// displayKey(data);
		// 	console.log(store.contentType);
		// 	res.contentType(store.contentType);
		// 	res.end(data, 'binary');
		// });
	});
});



// download file to PC
app.get("/file/download/:id", function(req, res, next) {
	var options = []
	return savepicv2.getGridFile(req.params.id, options, function(err, store) {
		if (err) {
			console.log('get file error ===============');
			console.log(err);
			next(new Error('can not get file '));
		}

		res.header("Content-Type", store.contentType);
		res.header("Content-Disposition", "attachment; filename=" + store.filename);
		console.log('get file ======================');
		
		// res.writeHead(200, {'Content-Type': 'image/jpeg'});
		// res.writeHead(200, {'Content-Type': store.contentType});
		
		return store.stream(true).pipe(res);
		// store.stream(true).pipe(res);
		// store.read(function(err, data) {
		// 	// displayKey(data);
		// 	console.log(store.contentType);
		// 	res.contentType(store.contentType);
		// 	res.end(data, 'binary');
		// });
	});
});

app.get("/delete", function(req, res) {
	res.render('delete', {title: 'delete background image'});
});

app.post("/delete", function(req, res) {
	var options = [];
	// id, options, fn
	console.log('delete =====================');
	// displayKey(req.body);

	savepicv2.deleteGridFile(req.body.id, options, function(err, result) {
		return res.redirect('/');
	});
});

app.use(errorHandler.error);
app.use(errorHandler.notFound);

app.listen(3000, function() {
	return console.log("Server running on port 3000");
});