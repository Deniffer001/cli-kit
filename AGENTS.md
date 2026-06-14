# cli-kit
> argc-based runtime for agent-drivable admin/operator CLIs.

成员清单
src/errors.ts: machine-classified CliError contract + pluggable normalizer (errorMappers)
src/output.ts: agent-first JSON output service (success/error) with optional pretty rendering

接缝（待实现）
- schema-selector: jq 式 argc schema 发现（依赖 argc）
- paging: 不透明游标分页 envelope
- contracts: truth-source 构造器 + 结果信封类型
- command: runCliCommand(ctx, runner)
- client: 注入式后端客户端适配器（Convex / REST ...）
- profile: env 文件 → 类型化 profile
- createCli(): 运行时骨架（argv → selector → run → output）

约定
- bun + valibot；argc 作 peer dep
- 不写 barrel(index.ts)，通过 package.json exports 子路径导出
- type 优先于 interface；不用 default export；文件 kebab-case

[PROTOCOL]: 变更模块时更新「成员清单」，再检查本文件
