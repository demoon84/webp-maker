const fs = require('fs');
const os = require('os');
const path = require('path');

exports.isDirectory = (targetPath) => {
	return fs.lstatSync(targetPath).isDirectory();
};

exports.ensureValue = (value, fieldName) => {
	if (value === undefined || value === null || value === '') {
		throw new Error(`"${fieldName}" is required.`);
	}
};

exports.ensureNumber = (value, fieldName, {min, max, integer = false} = {}) => {
	const parsed = Number(value);

	if (!Number.isFinite(parsed)) {
		throw new Error(`"${fieldName}" must be a valid number.`);
	}

	if (integer && !Number.isInteger(parsed)) {
		throw new Error(`"${fieldName}" must be an integer.`);
	}

	if (min !== undefined && parsed < min) {
		throw new Error(`"${fieldName}" must be greater than or equal to ${min}.`);
	}

	if (max !== undefined && parsed > max) {
		throw new Error(`"${fieldName}" must be less than or equal to ${max}.`);
	}

	return parsed;
};

exports.collectFiles = (rootPath, matcher) => {
	const result = [];
	const pending = [rootPath];

	while (pending.length > 0) {
		const currentPath = pending.pop();
		const entries = fs.readdirSync(currentPath, {withFileTypes: true});

		entries.forEach((entry) => {
			const absolutePath = path.join(currentPath, entry.name);

			if (entry.isDirectory()) {
				pending.push(absolutePath);
				return;
			}

			if (matcher(absolutePath, entry.name)) {
				result.push(absolutePath);
			}
		});
	}

	return result;
};

exports.ensureDirectory = (targetPath) => {
	fs.mkdirSync(targetPath, {recursive: true});
};

exports.defaultConcurrency = () => {
	const parallelism = typeof os.availableParallelism === 'function'
		? os.availableParallelism()
		: os.cpus().length;

	if (parallelism <= 1) {
		return 1;
	}

	return Math.min(parallelism - 1, 8);
};

exports.runWithConcurrency = async (items, concurrency, worker) => {
	if (items.length === 0) {
		return [];
	}

	const results = new Array(items.length);
	const workerCount = Math.min(concurrency, items.length);
	let index = 0;
	let stopped = false;

	const workers = Array.from({length: workerCount}, async () => {
		while (!stopped) {
			const currentIndex = index;
			index += 1;

			if (currentIndex >= items.length) {
				return;
			}

			try {
				results[currentIndex] = await worker(items[currentIndex], currentIndex);
			} catch (error) {
				stopped = true;
				throw error;
			}
		}
	});

	await Promise.all(workers);

	return results;
};
