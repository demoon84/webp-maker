const fs = require('fs');
const path = require('path');
const webp = require('webp-converter');
const {
	isDirectory,
	ensureValue,
	ensureNumber,
	collectFiles,
	ensureDirectory,
	defaultConcurrency,
	runWithConcurrency
} = require('./util');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

class cWebp {
	constructor(config = {}) {
		this.config = {
			from: '',
			to: '',
			quality: 75,
			concurrency: defaultConcurrency(),
			log: true,
			...config
		};
		this.fromIsDirectory = false;
		this.createdDirectories = new Set();
	}

	async run() {
		this.validate();
		this.fromIsDirectory = isDirectory(this.config.from);
		this.createdDirectories = new Set();

		const sourceFiles = this.detectSourceFiles();
		const converted = await runWithConcurrency(
			sourceFiles,
			this.config.concurrency,
			async (sourceFile) => this.convert(sourceFile)
		);

		const summary = {
			command: 'cwebp',
			from: this.config.from,
			to: this.config.to,
			quality: this.config.quality,
			concurrency: this.config.concurrency,
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
		this.config.concurrency = ensureNumber(this.config.concurrency, 'concurrency', {
			min: 1,
			max: 32,
			integer: true
		});
	}

	detectSourceFiles() {
		if (this.fromIsDirectory) {
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

	async convert(sourceFile) {
		const targetFile = this.toPath(this.relativePath(sourceFile));
		this.ensureOutputDirectory(path.dirname(targetFile));

		await webp.cwebp(sourceFile, targetFile, `-q ${this.config.quality}`);

		const result = {
			from: sourceFile,
			to: targetFile
		};

		this.log(`${sourceFile} => ${targetFile}`);

		return result;
	}

	relativePath(sourceFile) {
		if (!this.fromIsDirectory) {
			return path.basename(sourceFile);
		}

		return path.relative(this.config.from, sourceFile);
	}

	ensureOutputDirectory(targetDirectory) {
		if (this.createdDirectories.has(targetDirectory)) {
			return;
		}

		ensureDirectory(targetDirectory);
		this.createdDirectories.add(targetDirectory);
	}

	toPath(fromFileName) {
		const outputPath = path.join(this.config.to, fromFileName);
		const parsedPath = path.parse(outputPath);

		return path.join(parsedPath.dir, `${parsedPath.name}.webp`);
	}

	log(message) {
		if (this.config.log) {
			console.log(message);
		}
	}
}

module.exports = cWebp;
