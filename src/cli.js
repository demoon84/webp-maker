const fs = require('fs');
const path = require('path');
const {cwebp, awebp} = require('./index');

const HELP_TEXT = `
webp-maker

Usage
  webp-maker cwebp --from <path> --to <dir> [--quality <0-100>] [--config <file>] [--json]
  webp-maker awebp --from <dir> --to <file> [--fps <number>] [--repeat <number>] [--config <file>] [--json]
  webp-maker pipeline --from <path> --webp-dir <dir> --to <file> [--quality <0-100>] [--fps <number>] [--repeat <number>] [--config <file>] [--json]

Commands
  cwebp      Convert PNG/JPG files to .webp
  awebp      Create an animated .webp from a directory of .webp frames
  pipeline   Run cwebp and then awebp in one command

Options
  --from       Source file or directory
  --to         Output directory for cwebp, output file for awebp/pipeline
  --webp-dir   Intermediate .webp directory used by pipeline
  --quality    Conversion quality for cwebp (default: 75)
  --fps        Frames per second for awebp (default: 30)
  --repeat     Animation loop count for awebp (default: 0)
  --config     JSON config file. CLI flags override config file values.
  --json       Print structured JSON output
  --help       Show this help

Examples
  webp-maker cwebp --from ./origin --to ./webp --quality 90
  webp-maker awebp --from ./webp --to ./awebp/ani.webp --fps 10
  webp-maker pipeline --from ./origin --webp-dir ./webp --to ./awebp/ani.webp --quality 90 --fps 10 --json
`.trim();

const COMMAND_ALIASES = {
	convert: 'cwebp',
	animate: 'awebp',
	build: 'pipeline'
};

async function main(argv = process.argv.slice(2)) {
	try {
		const parsed = parseArgs(argv);

		if (parsed.help) {
			console.log(HELP_TEXT);
			return 0;
		}

		const result = await runCommand(parsed.command, parsed.options);

		if (parsed.options.json) {
			console.log(JSON.stringify({
				ok: true,
				command: parsed.command,
				result
			}, null, 2));
		} else {
			printSummary(parsed.command, result);
		}

		return 0;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const wantsJson = argv.includes('--json');

		if (wantsJson) {
			console.error(JSON.stringify({
				ok: false,
				error: message
			}, null, 2));
		} else {
			console.error(`Error: ${message}`);
			console.error('');
			console.error(HELP_TEXT);
		}

		return 1;
	}
}

function parseArgs(argv) {
	if (argv.length === 0 || argv.includes('--help')) {
		return {
			help: true,
			command: null,
			options: {}
		};
	}

	const [rawCommand, ...restArgs] = argv;
	const command = COMMAND_ALIASES[rawCommand] || rawCommand;

	if (!['cwebp', 'awebp', 'pipeline'].includes(command)) {
		throw new Error(`Unknown command: ${rawCommand}`);
	}

	const cliOptions = parseOptions(restArgs);
	const fileConfig = cliOptions.config ? readConfig(cliOptions.config) : {};

	return {
		help: false,
		command,
		options: {
			...fileConfig,
			...cliOptions
		}
	};
}

function parseOptions(tokens) {
	const options = {};

	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];

		if (!token.startsWith('--')) {
			throw new Error(`Unexpected argument: ${token}`);
		}

		const key = token.slice(2);

		if (key === 'json') {
			options.json = true;
			continue;
		}

		if (key === 'help') {
			options.help = true;
			continue;
		}

		const value = tokens[index + 1];

		if (value === undefined || value.startsWith('--')) {
			throw new Error(`Missing value for --${key}`);
		}

		options[toCamelCase(key)] = value;
		index++;
	}

	return options;
}

function readConfig(configPath) {
	const absolutePath = path.resolve(configPath);

	if (!fs.existsSync(absolutePath)) {
		throw new Error(`Config file not found: ${configPath}`);
	}

	try {
		return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
	} catch (error) {
		throw new Error(`Invalid JSON config: ${configPath}`);
	}
}

async function runCommand(command, options) {
	switch (command) {
		case 'cwebp':
			return cwebp(withoutUndefined({
				...options,
				log: false
			}));
		case 'awebp':
			return awebp(withoutUndefined({
				...options,
				log: false
			}));
		case 'pipeline': {
			if (!options.webpDir) {
				throw new Error(`"webp-dir" is required for pipeline.`);
			}

			const convertResult = await cwebp(withoutUndefined({
				from: options.from,
				to: options.webpDir,
				quality: options.quality,
				log: false
			}));
			const animateResult = await awebp(withoutUndefined({
				from: options.webpDir,
				to: options.to,
				fps: options.fps,
				repeat: options.repeat,
				log: false
			}));

			return {
				command: 'pipeline',
				convert: convertResult,
				animate: animateResult
			};
		}
		default:
			throw new Error(`Unsupported command: ${command}`);
	}
}

function printSummary(command, result) {
	switch (command) {
		case 'cwebp':
			console.log(`Converted ${result.count} file(s) to ${result.to}`);
			return;
		case 'awebp':
			console.log(`Created animated webp ${result.to} from ${result.count} frame(s)`);
			return;
		case 'pipeline':
			console.log(`Converted ${result.convert.count} file(s) to ${result.convert.to}`);
			console.log(`Created animated webp ${result.animate.to} from ${result.animate.count} frame(s)`);
			return;
		default:
			console.log(JSON.stringify(result, null, 2));
	}
}

function toCamelCase(value) {
	return value.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}

function withoutUndefined(value) {
	return Object.fromEntries(
		Object.entries(value).filter(([, entry]) => entry !== undefined)
	);
}

module.exports = {
	HELP_TEXT,
	main,
	parseArgs
};

if (require.main === module) {
	main().then((code) => {
		process.exitCode = code;
	});
}
