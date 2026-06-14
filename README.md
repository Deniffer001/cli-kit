# @deniffer/cli-kit

> The runtime layer above [argc](https://github.com/ethan-huo/argc) for building **agent-drivable admin / operator CLIs**.

argc gives you the parser and the AI-readable schema. `cli-kit` gives you the rest — the conventions every backend admin CLI ends up re-implementing. Extracted from three real production CLIs that had each copy-pasted this same layer.

> Status: early but real — every module is extracted from production and covered by tests.

## Install

```bash
bun add github:Deniffer001/cli-kit
```

Built for Bun. `argc` and `valibot` are peer dependencies.

## Modules

| Subpath | What |
|---|---|
| `@deniffer/cli-kit/errors` | `CliError` + `normalizeCliError(error, mappers?)` — extensible codes, pluggable mappers |
| `@deniffer/cli-kit/output` | `createOutputService({ pretty })` — agent-first `ok/data` or `ok/error` JSON |
| `@deniffer/cli-kit/client` | `defineClientAdapter()` — the pluggable backend-client seam |
| `@deniffer/cli-kit/services` | `createCliServices()` — lazy `{ context, output, getClient }` container |
| `@deniffer/cli-kit/command` | `runCliCommand(services, runner)` — uniform run + error + exit code |
| `@deniffer/cli-kit/dataset-pagination` | `paginateDataset()` — opaque-cursor paging + envelope validators |
| `@deniffer/cli-kit/continuation` | `buildContinuation()` — replayable "do exactly this next" payloads |
| `@deniffer/cli-kit/schema-selector` | jq-style selectors over argc router trees |
| `@deniffer/cli-kit/schema-discovery` | `expandSchemaSelector()` — `--schema [selector]` discovery for agents |
| `@deniffer/cli-kit/profile` | `defineProfile()` — env file → typed, validated profile |

See [`examples/backlink-style.test.ts`](examples/backlink-style.test.ts) for an end-to-end consumer that wires a provider adapter, services, paging, and the error seam together.

## License

MIT
