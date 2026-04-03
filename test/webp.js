const {cwebp, awebp} = require('../src/index');

async function main() {
	await cwebp({
		from: './origin',
		to: './webp',
		quality: 90
	});

	await awebp({
		from: './webp',
		fps: 10,
		to: './awebp/ani.webp'
	});
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
