/**
 * @input CLI output mode plus success or error payloads
 * @output agent-first JSON output with optional human-friendly rendering
 * @pos CLI serialization boundary between handlers and terminal
 * @protocol Update header on change, then check AGENTS.md
 */

import { inspect } from "node:util";

import { type CliErrorMapper, normalizeCliError } from "./errors";

export type Output<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; hint?: string } };

export type HumanLines<T> = string[] | ((data: T) => string[]);

export type OutputService = {
  success: <T>(data: T, human?: HumanLines<T>) => void;
  error: (error: unknown, human?: string[]) => void;
};

export type OutputOptions = {
  pretty?: boolean;
  errorMappers?: CliErrorMapper[];
};

function printJson<T>(value: Output<T>) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function formatUnknown(value: unknown) {
  return inspect(value, { depth: null, colors: false, compact: false, sorted: true });
}

function resolveHumanLines<T>(data: T, human?: HumanLines<T>) {
  if (!human) {
    return [formatUnknown(data)];
  }

  return typeof human === "function" ? human(data) : human;
}

export function createOutputService(options: OutputOptions = {}): OutputService {
  const pretty = options.pretty ?? false;
  const errorMappers = options.errorMappers ?? [];

  return {
    success<T>(data: T, human?: HumanLines<T>) {
      if (!pretty) {
        printJson({ ok: true, data });
        return;
      }

      process.stdout.write(`${resolveHumanLines(data, human).join("\n")}\n`);
    },

    error(error: unknown, human?: string[]) {
      const normalized = normalizeCliError(error, errorMappers);

      if (!pretty) {
        printJson({
          ok: false,
          error: { code: normalized.code, message: normalized.message, hint: normalized.hint },
        });
        return;
      }

      const lines = human ?? [`Error [${normalized.code}]: ${normalized.message}`];
      if (normalized.hint) {
        lines.push(`Hint: ${normalized.hint}`);
      }
      process.stderr.write(`${lines.join("\n")}\n`);
    },
  };
}
