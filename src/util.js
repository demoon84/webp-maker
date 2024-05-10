const fs = require('fs');

exports.removeEndSlash = (path) => {
	return path.replace(/\/$/, '');
};

exports.isDirectory = (from) => {
	return fs.lstatSync(from).isDirectory();
};
