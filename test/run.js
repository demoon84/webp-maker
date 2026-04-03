const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const fsExtra = require('fs-extra');
const {cwebp, awebp} = require('../src/index');

async function main() {
	const projectRoot = path.resolve(__dirname, '..');
	const originDir = path.join(projectRoot, 'test', 'origin');
	const tempRoot = path.join(projectRoot, 'test', '.tmp');
	const cliPath = path.join(projectRoot, 'bin', 'webp-maker.js');

	fsExtra.removeSync(tempRoot);
	fsExtra.ensureDirSync(tempRoot);

	try {
		await testLibraryApi(originDir, tempRoot);
		testCli(originDir, tempRoot, cliPath);
	} finally {
		fsExtra.removeSync(tempRoot);
	}
}

async function testLibraryApi(originDir, tempRoot) {
	const outputDir = path.join(tempRoot, 'api-webp');
	const animationPath = path.join(tempRoot, 'api-awebp', 'ani.webp');

	const convertResult = await cwebp({
		from: originDir,
		to: outputDir,
		quality: 90,
		log: false
	});

	assert.equal(convertResult.count, 6);
	assert.equal(fs.existsSync(path.join(outputDir, '1.webp')), true);

	const animateResult = await awebp({
		from: outputDir,
		to: animationPath,
		fps: 10,
		log: false
	});

	assert.equal(animateResult.count, 6);
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
		'--json'
	], {
		encoding: 'utf8'
	});

	assert.equal(convertResult.status, 0, convertResult.stderr);

	const convertPayload = JSON.parse(convertResult.stdout);

	assert.equal(convertPayload.ok, true);
	assert.equal(convertPayload.result.count, 6);
	assert.equal(fs.existsSync(path.join(cliWebpDir, '6.webp')), true);

	const pipelineResult = spawnSync(process.execPath, [
		cliPath,
		'pipeline',
		'--from', originDir,
		'--webp-dir', cliPipelineWebpDir,
		'--to', cliPipelineAnimationPath,
		'--quality', '90',
		'--fps', '10',
		'--json'
	], {
		encoding: 'utf8'
	});

	assert.equal(pipelineResult.status, 0, pipelineResult.stderr);

	const pipelinePayload = JSON.parse(pipelineResult.stdout);

	assert.equal(pipelinePayload.ok, true);
	assert.equal(pipelinePayload.result.convert.count, 6);
	assert.equal(pipelinePayload.result.animate.count, 6);
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
	assert.equal(animatePayload.result.count, 6);
	assert.equal(fs.existsSync(cliAnimationPath), true);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
