# webp-maker

Convert PNG/JPG images to `.webp` and build animated `.webp` files from the command line or from Node.js.

## Install

```bash
npm install webp-maker
```

Check the CLI:

```bash
npx webp-maker --help
```

## Quick Start

Convert images to `.webp`:

```bash
webp-maker cwebp --from ./origin --to ./webp --quality 90 --concurrency 4
```

Build an animated `.webp` from converted frames:

```bash
webp-maker awebp --from ./webp --to ./awebp/ani.webp --fps 10
```

Run the full flow in one command:

```bash
webp-maker pipeline \
  --from ./origin \
  --webp-dir ./webp \
  --to ./awebp/ani.webp \
  --quality 90 \
  --concurrency 4 \
  --fps 10 \
  --json
```

## CLI

The CLI is non-interactive and uses explicit long option names only, which makes it easy to call from scripts, CI, and AI agents.

For `cwebp`, the default concurrency is chosen automatically from available CPU cores and capped at `8`.

### Commands

#### `cwebp`

Convert a single file or a directory of `png`, `jpg`, `jpeg` files to `.webp`.

```bash
webp-maker cwebp --from ./origin --to ./webp --quality 90 --concurrency 4
```

| Option | Required | Default | Description |
|------|----------|---------|-------------|
| `--from` | yes |  | source file or directory |
| `--to` | yes |  | output directory |
| `--quality` | no | `75` | output quality from `0` to `100` |
| `--concurrency` | no | `auto` | number of parallel conversions, capped automatically |
| `--config` | no |  | JSON config file |
| `--json` | no | `false` | print machine-readable JSON |

#### `awebp`

Create an animated `.webp` from a directory of `.webp` frames.

```bash
webp-maker awebp --from ./webp --to ./awebp/ani.webp --fps 10 --repeat 0
```

| Option | Required | Default | Description |
|------|----------|---------|-------------|
| `--from` | yes |  | source `.webp` directory |
| `--to` | yes |  | output animated `.webp` file |
| `--fps` | no | `30` | frames per second |
| `--repeat` | no | `0` | animation loop count |
| `--config` | no |  | JSON config file |
| `--json` | no | `false` | print machine-readable JSON |

#### `pipeline`

Run `cwebp` first and then `awebp` in one command.

```bash
webp-maker pipeline --from ./origin --webp-dir ./webp --to ./awebp/ani.webp --quality 90 --concurrency 4 --fps 10 --json
```

| Option | Required | Default | Description |
|------|----------|---------|-------------|
| `--from` | yes |  | source file or directory |
| `--webp-dir` | yes |  | intermediate `.webp` directory |
| `--to` | yes |  | output animated `.webp` file |
| `--quality` | no | `75` | output quality for `cwebp` |
| `--concurrency` | no | `auto` | number of parallel conversions for `cwebp` |
| `--fps` | no | `30` | frames per second for `awebp` |
| `--repeat` | no | `0` | animation loop count |
| `--config` | no |  | JSON config file |
| `--json` | no | `false` | print machine-readable JSON |

### Config File

CLI flags override values from the config file.

```json
{
  "from": "./origin",
  "webpDir": "./webp",
  "to": "./awebp/ani.webp",
  "quality": 90,
  "concurrency": 4,
  "fps": 10,
  "repeat": 0
}
```

Example file in this repository:

[`examples/ai-pipeline.config.json`](/Users/demoon/Documents/project/webp-maker/examples/ai-pipeline.config.json)

```bash
webp-maker pipeline --config ./webp-maker.json --json
```

```bash
webp-maker pipeline --config ./examples/ai-pipeline.config.json --json
```

### JSON Output

When `--json` is enabled, the CLI prints structured output and uses exit code `0` on success, `1` on failure.

Success example:

```json
{
  "ok": true,
  "command": "cwebp",
  "result": {
    "command": "cwebp",
    "from": "./origin",
    "to": "./webp",
    "quality": 90,
    "concurrency": 4,
    "count": 6,
    "files": [
      {
        "from": "./origin/1.png",
        "to": "./webp/1.webp"
      }
    ]
  }
}
```

Error example:

```json
{
  "ok": false,
  "error": "..."
}
```

## Library

```js
const {cwebp, awebp} = require('webp-maker');

async function run() {
  const converted = await cwebp({
    from: './origin',
    to: './webp',
    quality: 90,
    concurrency: 4
  });

  const animated = await awebp({
    from: './webp',
    to: './awebp/ani.webp',
    fps: 10,
    repeat: 0
  });

  console.log(converted.count, animated.to);
}

run();
```

### `cwebp(config)`

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `from` | `string` |  | source file or directory |
| `to` | `string` |  | output directory |
| `quality` | `number` | `75` | output quality |
| `concurrency` | `number` | `auto` | number of parallel conversions |
| `log` | `boolean` | `true` | print progress logs |

Returns a Promise that resolves to a conversion summary object.

### `awebp(config)`

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `from` | `string` |  | source `.webp` directory |
| `to` | `string` |  | output animated `.webp` file |
| `fps` | `number` | `30` | frames per second |
| `repeat` | `number` | `0` | animation loop count |
| `log` | `boolean` | `true` | print progress logs |

Returns a Promise that resolves to an animation summary object.

## Development

Run the test suite:

```bash
npm test
```

The smoke test generates tiny temporary images at runtime, so the repository does not need to keep binary test fixtures.
