/**
 * @input a resolved context, a client adapter, and optional error mappers
 * @output a lazy service container for handlers (context, output, getClient)
 * @pos runtime services boundary shared by all command handlers
 * @protocol Update header on change, then check AGENTS.md
 */

import type { ClientAdapter, CliContext } from "./client";
import type { CliErrorMapper } from "./errors";
import { createOutputService, type OutputService } from "./output";

export type CliServices<TClient, TContext extends CliContext = CliContext> = {
  context: TContext;
  output: OutputService;
  getClient: () => TClient;
};

export function createCliServices<TClient, TContext extends CliContext>(input: {
  context: TContext;
  adapter: ClientAdapter<TClient, TContext>;
  errorMappers?: CliErrorMapper[];
}): CliServices<TClient, TContext> {
  let client: TClient | undefined;
  let created = false;

  return {
    context: input.context,
    output: createOutputService({ pretty: input.context.pretty, errorMappers: input.errorMappers }),
    getClient() {
      if (!created) {
        client = input.adapter(input.context);
        created = true;
      }
      return client as TClient;
    },
  };
}
