/**
 * @input machine-classified CLI error metadata
 * @output stable CliError shape for agent-facing runtime failures
 * @pos shared error-contract seam between handlers and output serialization
 * @protocol Update header on change, then check AGENTS.md
 */

/**
 * Baseline error codes shared across admin CLIs. Any string code is allowed;
 * this union exists for autocomplete and to document the common set. Product
 * layers extend it freely (e.g. "auth_error", "quota_error").
 */
export type CliErrorCode =
  | "invalid_input"
  | "missing_profile"
  | "not_found"
  | "unsupported"
  | "backend_failure"
  | "provider_failure"
  | "requires_provider_secret"
  // keep the union autocompletable while still allowing any custom string code
  | (string & {});

export class CliError extends Error {
  code: CliErrorCode;
  hint?: string;

  constructor(input: { code: CliErrorCode; message: string; hint?: string }) {
    super(input.message);
    this.name = "CliError";
    this.code = input.code;
    this.hint = input.hint;
  }
}

export function cliError(input: { code: CliErrorCode; message: string; hint?: string }) {
  return new CliError(input);
}

/**
 * Consumer hook: map an unknown error to a CliError. Return null to defer to the
 * next mapper, or to the default `backend_failure` fallback. This is the seam
 * that lets a product layer add e.g. HTTP-status -> code mapping without forking
 * the core normalizer.
 */
export type CliErrorMapper = (error: unknown) => CliError | null;

export function normalizeCliError(error: unknown, mappers: CliErrorMapper[] = []) {
  if (error instanceof CliError) {
    return error;
  }

  for (const mapper of mappers) {
    const mapped = mapper(error);
    if (mapped) {
      return mapped;
    }
  }

  if (error instanceof Error) {
    return new CliError({ code: "backend_failure", message: error.message });
  }

  return new CliError({ code: "backend_failure", message: "Unknown CLI error" });
}
