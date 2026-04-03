const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const webp = require('webp-converter');
const {
	removeEndSlash,
	isDirectory,
	ensureValue,
	ensureNumber,
	collectFiles
} = require('./util');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

class cWebp {
	constructor(config = {}) {
		this.config = {
			from: '',
			to: '',
			quality: 75,
			log: true,
			...config
		};
	}

	async run() {
		this.validate();

		const sourceFiles = this.detectSourceFiles();
		const converted = [];

		for (const sourceFile of sourceFiles) {
			const targetFile = this.toPath(this.relativePath(sourceFile));

			fsExtra.ensureDirSync(path.dirname(targetFile));

			await webp.cwebp(sourceFile, targetFile, `-q ${this.config.quality}`);

			converted.push({
				from: sourceFile,
				to: targetFile
			});

			this.log(`${sourceFile} => ${targetFile}`);
		}

		const summary = {
			command: 'cwebp',
			from: this.config.from,
			to: this.config.to,
			quality: this.config.quality,
			count: converted.length,
			files: converted
		};

		this.log(`success convert ${summary.count} files`);

		return summary;
	}

	validate() {
		ensureValue(this.config.from, 'from');
		ensureValue(this.config.to, 'to');

		if (!fs.existsSync(this.config.from)) {
			throw new Error(`Source path not found: ${this.config.from}`);
		}

		this.config.quality = ensureNumber(this.config.quality, 'quality', {
			min: 0,
			max: 100
		});
	}

	detectSourceFiles() {
		if (isDirectory(this.config.from)) {
			const files = collectFiles(this.config.from, (absolutePath) => {
				return IMAGE_EXTENSIONS.has(path.extname(absolutePath).toLowerCase());
			});

			if (files.length === 0) {
				throw new Error(`No PNG/JPG files found in ${this.config.from}`);
			}

			return files.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
		}

		if (!IMAGE_EXTENSIONS.has(path.extname(this.config.from).toLowerCase())) {
			throw new Error(`Unsupported source file: ${this.config.from}`);
		}

		return [this.config.from];
	}

	relativePath(sourceFile) {
		if (!isDirectory(this.config.from)) {
			return path.basename(sourceFile);
		}

		return path.relative(this.config.from, sourceFile);
	}

	toPath(fromFileName) {
		return `${removeEndSlash(this.config.to)}/${fromFileName}`.replace(path.extname(fromFileName), '.webp');
	}

	log(message) {
		if (this.config.log) {
			console.log(message);
		}
	}
}

module.exports = cWebp;
