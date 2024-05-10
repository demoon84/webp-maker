const webp = require('webp-converter');
const {recurseSync} = require('file-system');
const fsExtra = require('fs-extra');
const path = require('path');
const {removeEndSlash, isDirectory} = require('./util');

class cWebp {
	#convertCount = 0;
	#successCount = 0;

	constructor(config, resolve) {
		this.config = {
			from: '',
			to: '',
			quality: 75,
			resolve,
			...config
		};

		this.run();
	}

	run() {
		isDirectory(this.config.from)
				? this.convertInDirectory()
				: this.convert({
					from: this.config.from,
					to: this.config.to,
					fileName: path.basename(this.config.from)
				});
	}

	convertInDirectory() {
		recurseSync(this.config.from, ['*.png', '*.jpg'], (filePath, relative) => {
			this.convert({
				from: filePath,
				to: path.dirname(this.toPath(relative)),
				fileName: relative
			});
		});
	}

	convert({from, to, fileName}) {
		this.#convertCount++;

		fsExtra.ensureDirSync(to);

		webp.cwebp(from, this.toPath(fileName), `-q ${this.config.quality}`).then(() => {
			this.#convertCount--;
			this.#successCount++;

			console.log(`===========================================================================================`);
			console.log(`${from} \n=> ${to}`);

			if (this.#convertCount === 0) {
				console.log(`===========================================================================================`);
				console.log(`success convert ${this.#successCount} files`);

				this.config.resolve();
			}
		});
	}

	toPath(fromFileName) {
		return `${removeEndSlash(this.config.to)}/${fromFileName}`.replace(path.extname(fromFileName), '.webp');
	}
}

module.exports = cWebp;
