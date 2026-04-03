const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const {spawnSync} = require('child_process');
const {cwebp, awebp} = require('../src/index');

async function main() {
	const projectRoot = path.resolve(__dirname, '..');
	const tempRoot = path.join(projectRoot, '.tmp-smoke');
	const originDir = path.join(tempRoot, 'origin');
	const cliPath = path.join(projectRoot, 'bin', 'webp-maker.js');

	fs.rmSync(tempRoot, {recursive: true, force: true});
	fs.mkdirSync(originDir, {recursive: true});

	try {
		createFixtures(originDir);
		await testLibraryApi(originDir, tempRoot);
		testCli(originDir, tempRoot, cliPath);
	} finally {
		fs.rmSync(tempRoot, {recursive: true, force: true});
	}
}

function createFixtures(originDir) {
	for (let index = 1; index <= 3; index += 1) {
		const color = [index * 40, 80, 200 - index * 30, 255];
		fs.writeFileSync(path.join(originDir, `${index}.png`), createPngBuffer(color));
	}
}

async function testLibraryApi(originDir, tempRoot) {
	const outputDir = path.join(tempRoot, 'api-webp');
	const animationPath = path.join(tempRoot, 'api-awebp', 'ani.webp');

	const convertResult = await cwebp({
		from: originDir,
		to: outputDir,
		quality: 90,
		concurrency: 2,
		log: false
	});

	assert.equal(convertResult.count, 3);
	assert.equal(convertResult.concurrency, 2);
	assert.equal(fs.existsSync(path.join(outputDir, '1.webp')), true);

	const animateResult = await awebp({
		from: outputDir,
		to: animationPath,
		fps: 10,
		log: false
	});

	assert.equal(animateResult.count, 3);
	assert.equal(fs.existsSync(animationPath), true);
}

function testCli(originDir, tempRoot, cliPath) {
	const cliWebpDir = path.join(tempRoot, 'cli-webp');
	const cliAnimationPath = path.join(tempRoot, 'cli-awebp', 'ani.webp');
	const cliPipelineWebpDir = path.join(tempRoot, 'cli-pipeline-webp');
	const cliPipelineAnimationPath = path.join(tempRoot, 'cli-pipeline-awebp', 'ani.webp');

	const convertResult = spawnSync(process.execPath, [
		cliPath,
		'cwebp',
		'--from', originDir,
		'--to', cliWebpDir,
		'--quality', '90',
		'--concurrency', '2',
		'--json'
	], {
		encoding: 'utf8'
	});

	assert.equal(convertResult.status, 0, convertResult.stderr);

	const convertPayload = JSON.parse(convertResult.stdout);

	assert.equal(convertPayload.ok, true);
	assert.equal(convertPayload.result.count, 3);
	assert.equal(convertPayload.result.concurrency, 2);
	assert.equal(fs.existsSync(path.join(cliWebpDir, '3.webp')), true);

	const pipelineResult = spawnSync(process.execPath, [
		cliPath,
		'pipeline',
		'--from', originDir,
		'--webp-dir', cliPipelineWebpDir,
		'--to', cliPipelineAnimationPath,
		'--quality', '90',
		'--concurrency', '2',
		'--fps', '10',
		'--json'
	], {
		encoding: 'utf8'
	});

	assert.equal(pipelineResult.status, 0, pipelineResult.stderr);

	const pipelinePayload = JSON.parse(pipelineResult.stdout);

	assert.equal(pipelinePayload.ok, true);
	assert.equal(pipelinePayload.result.convert.count, 3);
	assert.equal(pipelinePayload.result.convert.concurrency, 2);
	assert.equal(pipelinePayload.result.animate.count, 3);
	assert.equal(fs.existsSync(cliPipelineAnimationPath), true);

	const animateResult = spawnSync(process.execPath, [
		cliPath,
		'awebp',
		'--from', cliWebpDir,
		'--to', cliAnimationPath,
		'--fps', '10',
		'--json'
	], {
		encoding: 'utf8'
	});

	assert.equal(animateResult.status, 0, animateResult.stderr);

	const animatePayload = JSON.parse(animateResult.stdout);

	assert.equal(animatePayload.ok, true);
	assert.equal(animatePayload.result.count, 3);
	assert.equal(fs.existsSync(cliAnimationPath), true);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

function createPngBuffer([red, green, blue, alpha]) {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	const ihdr = Buffer.alloc(13);

	ihdr.writeUInt32BE(1, 0);
	ihdr.writeUInt32BE(1, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	const pixel = Buffer.from([0, red, green, blue, alpha]);
	const idat = zlib.deflateSync(pixel);

	return Buffer.concat([
		signature,
		makeChunk('IHDR', ihdr),
		makeChunk('IDAT', idat),
		makeChunk('IEND', Buffer.alloc(0))
	]);
}

function makeChunk(type, data) {
	const typeBuffer = Buffer.from(type, 'ascii');
	const lengthBuffer = Buffer.alloc(4);
	const crcBuffer = Buffer.alloc(4);
	const payload = Buffer.concat([typeBuffer, data]);

	lengthBuffer.writeUInt32BE(data.length, 0);
	crcBuffer.writeUInt32BE(crc32(payload), 0);

	return Buffer.concat([lengthBuffer, payload, crcBuffer]);
}

function crc32(buffer) {
	let crc = 0xffffffff;

	for (const value of buffer) {
		crc ^= value;

		for (let bit = 0; bit < 8; bit += 1) {
			if ((crc & 1) === 1) {
				crc = (crc >>> 1) ^ 0xedb88320;
			} else {
				crc >>>= 1;
			}
		}
	}

	return (crc ^ 0xffffffff) >>> 0;
}
