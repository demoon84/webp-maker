const cWebp = require('./cWebp');
const aWebp = require('./aWebp');

module.exports = {
	cwebp: (config) => new cWebp(config).run(),
	awebp: (config) => new aWebp(config).run()
};
