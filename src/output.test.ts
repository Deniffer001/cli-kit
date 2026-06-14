import { describe, expect, it, vi } from "vitest";

import { cliError } from "./errors";
import { createOutputService } from "./output";

function captureStdout() {
  const writes: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    writes.push(String(chunk));
    return true;
  });
  return { writes, restore: () => spy.mockRestore() };
}

describe("createOutputService (json mode)", () => {
  it("prints { ok: true, data } as JSON by default", () => {
    const capture = captureStdout();
    createOutputService().success({ id: 1 });
    capture.restore();

    expect(JSON.parse(capture.writes.join(""))).toEqual({ ok: true, data: { id: 1 } });
  });

  it("prints { ok: false, error } for a CliError", () => {
    const capture = captureStdout();
    createOutputService().error(cliError({ code: "not_found", message: "missing", hint: "check id" }));
    capture.restore();

    expect(JSON.parse(capture.writes.join(""))).toEqual({
      ok: false,
      error: { code: "not_found", message: "missing", hint: "check id" },
    });
  });
});

describe("createOutputService (pretty mode)", () => {
  it("renders human lines instead of JSON on success", () => {
    const capture = captureStdout();
    createOutputService({ pretty: true }).success({ a: 1 }, ["row one"]);
    capture.restore();

    expect(capture.writes.join("")).toBe("row one\n");
  });
});
