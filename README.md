# @deniffer/cli-kit

> The runtime layer above [argc](https://github.com/ethan-huo/argc) for building **agent-drivable admin / operator CLIs**.

argc gives you the parser and the AI-readable schema. `cli-kit` gives you the rest — the conventions every backend admin CLI ends up re-implementing:

- **typed errors** — a machine-classified `CliError` contract with a pluggable normalizer
- **JSON-first output** — `{ ok, data } | { ok, error }`, with an optional human-friendly `--pretty` mode
- jq-style **schema selectors** _(landing soon)_
- opaque-cursor **paging** _(landing soon)_
- a lazy **service container** + a **pluggable backend client** adapter _(landing soon)_

Extracted from three real production CLIs that had each copy-pasted this same layer.

> Status: early extraction — built in the open, one module at a time.

## Install

```bash
bun add github:Deniffer001/cli-kit
```

## Modules

```ts
import { cliError, normalizeCliError } from "@deniffer/cli-kit/errors"
import { createOutputService } from "@deniffer/cli-kit/output"
```

- `@deniffer/cli-kit/errors` — `CliError`, `cliError()`, `normalizeCliError(error, mappers?)`
- `@deniffer/cli-kit/output` — `createOutputService({ pretty })` → agent-first JSON output

## License

MIT
