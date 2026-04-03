const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const webp = require('webp-converter');
const {removeEndSlash, ensureValue, ensureNumber} = require('./util');

class aWebp {
	#inputFiles = [];

	constructor(config = {}) {
		this.config = {
			from: '',
			to: '',
			fps: 30,
			repeat: 0,
			log: true,
			...config
		};
	}

	async run() {
		this.validate();

		this.#inputFiles = this.detectFiles();

		const frames = this.makeInputData();

		fsExtra.ensureDirSync(path.dirname(this.config.to));

		await webp.webpmux_animate(frames, this.config.to, this.config.repeat, '0,255,255,255', '');

		const summary = {
			command: 'awebp',
			from: this.config.from,
			to: this.config.to,
			fps: this.config.fps,
			repeat: this.config.repeat,
			count: frames.length,
			files: frames.map(frame => frame.path)
		};

		this.log(`created animated webp ${this.config.to}`);

		return summary;
	}

	validate() {
		ensureValue(this.config.from, 'from');
		ensureValue(this.config.to, 'to');

		if (!fs.existsSync(this.config.from)) {
			throw new Error(`Source path not found: ${this.config.from}`);
		}

		if (!fs.lstatSync(this.config.from).isDirectory()) {
			throw new Error(`"from" must be a directory that contains .webp frames.`);
		}

		this.config.fps = ensureNumber(this.config.fps, 'fps', {
			min: 1
		});
		this.config.repeat = ensureNumber(this.config.repeat, 'repeat', {
			min: 0,
			integer: true
		});
	}

	detectFiles() {
		const files = fs.readdirSync(this.config.from)
			.filter((fileName) => path.extname(fileName).toLowerCase() === '.webp')
			.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

		if (files.length === 0) {
			throw new Error(`No .webp files found in ${this.config.from}`);
		}

		return files;
	}

	makeInputData() {
		const result = [];
		const delay = Math.floor(1000 / this.config.fps);

		this.#inputFiles.forEach((fileName) => {
			result.push({
				path: `${removeEndSlash(this.config.from)}/${fileName}`,
				offset: `+${delay}+0+0+0-b`
			});
		});

		return result;
	}

	log(message) {
		if (this.config.log) {
			console.log(message);
		}
	}
}

module.exports = aWebp;
