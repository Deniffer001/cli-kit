/**
 * @input CLI services plus an async handler runner
 * @output uniform command execution — run, serialize any error, set a non-zero exit code on failure
 * @pos shared command-execution boundary between argc handlers and the process
 * @protocol Update header on change, then check AGENTS.md
 */

import type { CliContext } from "./client";
import type { CliServices } from "./services";

export async function runCliCommand<TClient, TContext extends CliContext>(
  services: CliServices<TClient, TContext>,
  runner: (services: CliServices<TClient, TContext>) => Promise<void>,
): Promise<void> {
  try {
    await runner(services);
  } catch (error) {
    services.output.error(error);
    process.exitCode = 1;
  }
}
