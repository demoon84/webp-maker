const cWebp = require('./cWebp');
const aWebp = require('./aWebp');

module.exports = {
	cwebp: (config) => {
		return new Promise(resolve => {
			new cWebp(config, resolve);
		});
	},
	awebp: config => new aWebp(config)
};
