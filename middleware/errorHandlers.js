exports.notFound = function notFound(req, res, next) {
	// res.status(404).render('404', {title: 'Sorry, we cannot find that!'}); //need to add view (404.jade)
	res.status(404).send('404 Error Sorry, we cannot find that!');
};

exports.error = function error(err, req, res, next) {
	console.log(err);
	// res.status(500).render('500', {title: 'something blew up'}); //need to add view (500.jade)
	res.status(500).send('500 Error something blew up')
}