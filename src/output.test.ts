import { describe, expect, it, spyOn } from "bun:test";

import { cliError } from "./errors";
import { createOutputService } from "./output";

function capture(stream: "stdout" | "stderr") {
  const writes: string[] = [];
  const spy = spyOn(process[stream], "write").mockImplementation(((chunk: string | Uint8Array) => {
    writes.push(String(chunk));
    return true;
  }) as typeof process.stdout.write);
  return { writes, restore: () => spy.mockRestore() };
}

describe("createOutputService", () => {
  it("prints { ok: true, data } as JSON to stdout by default", () => {
    const out = capture("stdout");
    createOutputService().success({ id: 1 });
    out.restore();

    expect(JSON.parse(out.writes.join(""))).toEqual({ ok: true, data: { id: 1 } });
  });

  it("prints { ok: false, error } as JSON to stderr", () => {
    const out = capture("stderr");
    createOutputService().error(cliError({ code: "not_found", message: "missing", hint: "check id" }));
    out.restore();

    expect(JSON.parse(out.writes.join(""))).toEqual({
      ok: false,
      error: { code: "not_found", message: "missing", hint: "check id" },
    });
  });

  it("omits an absent hint from the error envelope", () => {
    const out = capture("stderr");
    createOutputService().error(cliError({ code: "backend_failure", message: "boom" }));
    out.restore();

    expect(JSON.parse(out.writes.join(""))).toEqual({
      ok: false,
      error: { code: "backend_failure", message: "boom" },
    });
  });

  it("renders human lines instead of JSON in pretty mode", () => {
    const out = capture("stdout");
    createOutputService({ pretty: true }).success({ a: 1 }, ["row one"]);
    out.restore();

    expect(out.writes.join("")).toBe("row one\n");
  });
});
