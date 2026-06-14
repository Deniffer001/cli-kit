import { describe, expect, it } from "vitest";

import { CliError, type CliErrorMapper, cliError, normalizeCliError } from "./errors";

describe("cliError", () => {
  it("creates a CliError carrying code, message, and hint", () => {
    const error = cliError({ code: "invalid_input", message: "bad", hint: "fix it" });

    expect(error).toBeInstanceOf(CliError);
    expect(error.name).toBe("CliError");
    expect(error.code).toBe("invalid_input");
    expect(error.message).toBe("bad");
    expect(error.hint).toBe("fix it");
  });
});

describe("normalizeCliError", () => {
  it("returns existing CliError instances unchanged", () => {
    const error = cliError({ code: "not_found", message: "missing" });

    expect(normalizeCliError(error)).toBe(error);
  });

  it("wraps a plain Error as backend_failure", () => {
    const error = normalizeCliError(new Error("boom"));

    expect(error.code).toBe("backend_failure");
    expect(error.message).toBe("boom");
  });

  it("wraps a non-Error value as backend_failure with a default message", () => {
    const error = normalizeCliError("nope");

    expect(error.code).toBe("backend_failure");
    expect(error.message).toBe("Unknown CLI error");
  });

  it("applies custom mappers before the default fallback", () => {
    const httpMapper: CliErrorMapper = (error) => {
      const status = error instanceof Error ? Reflect.get(error, "status") : null;
      if (status === 401) {
        return cliError({ code: "auth_error", message: "unauthorized" });
      }
      return null;
    };

    const unauthorized = Object.assign(new Error("no"), { status: 401 });
    expect(normalizeCliError(unauthorized, [httpMapper]).code).toBe("auth_error");

    const serverError = Object.assign(new Error("no"), { status: 500 });
    expect(normalizeCliError(serverError, [httpMapper]).code).toBe("backend_failure");
  });
});
