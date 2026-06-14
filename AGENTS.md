# cli-kit
> argc-based runtime for agent-drivable admin/operator CLIs.

成员清单
src/errors.ts: machine-classified CliError contract + pluggable normalizer (errorMappers)
src/output.ts: agent-first JSON output service (success/error) with optional pretty rendering
src/client.ts: CliContext + ClientAdapter seam (defineClientAdapter) — bring your own backend
src/services.ts: lazy service container (createCliServices) — context + output + getClient
src/command.ts: runCliCommand(services, runner) — run, serialize error, set exit code
src/continuation.ts: buildContinuation() opaque replayable next-call payloads + validator
src/dataset-pagination.ts: paginateDataset() opaque-cursor paging + envelope validators
src/schema-selector.ts: jq-style selectors over argc router trees (parse/match/buildSubset)
src/schema-discovery.ts: expandSchemaSelector() — --schema [selector] agent discovery
src/profile.ts: defineProfile() — env file -> typed, validated profile loader
examples/backlink-style.test.ts: end-to-end consumer proof (not published)

约定
- bun + valibot；argc 作 peer dep；测试用 bun test
- 不写 barrel(index.ts)，通过 package.json exports 子路径导出
- type 优先于 interface；不用 default export；文件 kebab-case
- 每个模块顶部保留 @input/@output/@pos/@protocol 头注

未抽（有意为之）
- createCli 全量包装：与各 app 的 handler 树强耦合，泄漏成本高。推荐在你自己的
  index.ts 里组合 expandSchemaSelector + argc 的 cli().run({handlers})。

[PROTOCOL]: 变更模块时更新「成员清单」，再检查本文件
