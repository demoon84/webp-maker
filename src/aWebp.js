const webp = require('webp-converter');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const {removeEndSlash} = require('./util');

class aWebp {
	#inputFiles;
	#inputData;
	
	constructor(config) {
		this.config = {
			from: '',
			to: '',
			fps: 30,
			repeat: 0,
			...config
		};
		
		this.run().then(r => {
		});
	}
	
	async run() {
		this.#inputFiles = this.detectFiles();
		
		this.#inputData = this.makeInputData();
		
		fsExtra.ensureDirSync(path.dirname(this.config.to));
		
		try {
			const result = await webp.webpmux_animate(this.#inputData, this.config.to, this.config.repeat, '0,255,255,255', '');
			
			console.log(result);
		} catch (e) {
			console.log(e);
		}
	}
	
	detectFiles() {
		const files = fs.readdirSync(this.config.from);
		return files.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
	}
	
	makeInputData() {
		const result = [];
		const delay = Math.floor(1000 / this.config.fps);
		
		this.#inputFiles.forEach((fileName) => {
			if (/.DS_Store/.test(fileName)) return;
			
			result.push({
				'path': `${removeEndSlash(this.config.from)}/${fileName}`,
				'offset': `+${delay}+0+0+0-b`
			});
		});
		
		return result;
	}
}

module.exports = aWebp;
