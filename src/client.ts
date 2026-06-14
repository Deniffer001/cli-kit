/**
 * @input a CLI context plus a backend client factory
 * @output the pluggable client-adapter seam — cli-kit stays backend-agnostic, the consumer brings the client
 * @pos boundary between the generic CLI runtime and a product-specific backend (Convex, REST, ...)
 * @protocol Update header on change, then check AGENTS.md
 */

export type CliContext = {
  /** Render human-friendly lines instead of JSON. */
  pretty?: boolean;
};

/** A factory that turns a resolved context into a backend client. */
export type ClientAdapter<TClient, TContext extends CliContext = CliContext> = (context: TContext) => TClient;

/** Identity helper that pins an adapter's types for ergonomics at the call site. */
export function defineClientAdapter<TClient, TContext extends CliContext = CliContext>(
  adapter: ClientAdapter<TClient, TContext>,
): ClientAdapter<TClient, TContext> {
  return adapter;
}
