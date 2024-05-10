const {cwebp, awebp} = require('../src/index');

cwebp({
	from: './origin',
	to: './webp',
	quality: 90
}).then(() => {
	awebp({
		from: './webp',
		fps:10,
		to: './awebp/ani.webp'
	});
});
