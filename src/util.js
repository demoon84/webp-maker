const fs = require('fs');
const path = require('path');

exports.removeEndSlash = (targetPath) => {
	return targetPath.replace(/[\\/]+$/, '');
};

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
	const entries = fs.readdirSync(rootPath, {withFileTypes: true});
	const result = [];

	entries.forEach((entry) => {
		const absolutePath = path.join(rootPath, entry.name);

		if (entry.isDirectory()) {
			result.push(...exports.collectFiles(absolutePath, matcher));
			return;
		}

		if (matcher(absolutePath, entry.name)) {
			result.push(absolutePath);
		}
	});

	return result;
};
