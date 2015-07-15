exports.logger = function logger(req, res, next) {
	console.log('[req.url] -------------------------');
	console.log(req.url);
	next();
}