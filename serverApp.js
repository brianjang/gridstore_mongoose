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
app.use(multer({ dest: './uploads/'}))


app.get('/', function(req, res) {
	var data = {};
	var count = 0;
	console.log('GET / ====================');
	Counter.count(function(err, doc){
		if(err) {
			console.log(err);
			next(err);
		}

		console.log(doc);
		count = doc;

		if(count === 0) {
			console.log('GET / ====================');
			data['_id'] = 'imageid';
			data['seq'] = 0;
			Counter.create(data, function(err, doc){
				if(err) {
					console.log(err);
					next(err);
				}
				console.log(doc);
			});
		}
	});

	// console.log(count);

	
	
	

	res.render('index', {title: 'Upload background image'});
});


app.post("/upload", function(req, res) {
	// var form = new formidable.IncomingForm();


	// console.log('[upload] ===============');
	// aaa = req.files;
	// for(var k in aaa) {
	// 	console.log(k);
	// 	console.log(aaa[k]);
	// }

	console.log(req.files.file.path);
	console.log(req.files.file.originalname);
	console.log(req.files.file.mimetype);
	var options = [{content_type: req.files.file.mimetype}];

	savepicv2.putGridFileByPath(req.files.file.path, req.files.file.originalname /*file.filename*/, options, function(err, result) {
		// console.log('[result] =============');

			// res.send({result: result, rc: 0});
		// res.send({rc: 0});
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
		console.log('[upload] read buf ===============');
		console.log(files.file.path);

		savepicv2.putGridFileByPath(files.file.path, files.file.name /*file.filename*/, options, function(err, result) {
			console.log('[result] =============');

				// res.send({result: result, rc: 0});
			// res.send({rc: 0});
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
		// res.send('error form');

	});
});

app.get("/file/:id", function(req, res) {
	console.log('/file/:id ===============');
	console.log(req.params.id);
	var options = []
	return savepicv2.getGridFile(req.params.id, options, function(err, store) {
		console.log('/file/:id ===============');
		console.log(store.fileId);
		console.log(store.filename);
		console.log(store.contentType);
		console.log(store.metadata);
		console.log(store.filename.toString());
		console.log(store.fileId.toString());

		res.header("Content-Type", store.contentType);
		res.header("Content-Disposition", "attachment; filename=" + store.filename);
		return store.stream(true).pipe(res);
	});
});

app.listen(3000, function() {
	return console.log("Server running on port 3000");
});