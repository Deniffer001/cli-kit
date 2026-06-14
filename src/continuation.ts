/**
 * @input argc call ids plus validated command inputs
 * @output opaque continuation payloads plus a validator for dataset paging and action transitions
 * @pos optional continuation contract for cases where the system knows the only safe next call
 * @protocol Update header on change, then check AGENTS.md
 */

import { array, type InferOutput, literal, object, record, string, unknown } from "valibot";

export const continuationValidator = object({
  kind: literal("argc"),
  call: string(),
  input: record(string(), unknown()),
  argv: array(string()),
});

export type Continuation = InferOutput<typeof continuationValidator>;

/**
 * Build an opaque "do exactly this next" payload an agent can replay verbatim.
 * `bin` is the CLI binary name (argv[0]) — pass your CLI's name, e.g. "mycli".
 */
export function buildContinuation(input: {
  bin: string;
  call: string;
  payload: Record<string, unknown>;
}): Continuation {
  return {
    kind: "argc",
    call: input.call,
    input: input.payload,
    argv: [input.bin, ...input.call.split("."), "--input", JSON.stringify(input.payload)],
  };
}
