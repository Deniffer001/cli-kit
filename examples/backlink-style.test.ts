/**
 * End-to-end consumer proof: a backlink-style admin CLI (mirroring
 * product-growth-tools/backlink-cli) assembled entirely from cli-kit modules.
 * If this stays green, the extracted base is genuinely consumable.
 */

import { describe, expect, it, spyOn } from "bun:test";

import { defineClientAdapter } from "../src/client";
import { runCliCommand } from "../src/command";
import { paginateDataset } from "../src/dataset-pagination";
import { type CliErrorMapper, cliError } from "../src/errors";
import { createCliServices } from "../src/services";

// --- product layer: the backend, injected through the generic client-adapter seam ---
type BacklinkClient = {
  listBacklinks: (domain: string) => { url: string }[];
};

const backlinkAdapter = defineClientAdapter<BacklinkClient>(() => ({
  listBacklinks: (domain) =>
    Array.from({ length: 3 }, (_value, index) => ({ url: `https://ref${index}.example/${domain}` })),
}));

// --- product layer: its own error taxonomy, plugged into the base normalizer (the diff seam) ---
const backlinkErrorMapper: CliErrorMapper = (error) => {
  const status = error instanceof Error ? Reflect.get(error, "status") : null;
  if (status === 401 || status === 403) {
    return cliError({ code: "auth_error", message: "Check provider credentials." });
  }
  return null;
};

function capture(stream: "stdout" | "stderr") {
  const writes: string[] = [];
  const spy = spyOn(process[stream], "write").mockImplementation(((chunk: string | Uint8Array) => {
    writes.push(String(chunk));
    return true;
  }) as typeof process.stdout.write);
  return { json: () => JSON.parse(writes.join("")), restore: () => spy.mockRestore() };
}

describe("backlink-style consumer (integration proof)", () => {
  it("runs a paginated dataset handler end-to-end and emits a JSON envelope on stdout", async () => {
    const services = createCliServices({
      context: { pretty: false },
      adapter: backlinkAdapter,
      errorMappers: [backlinkErrorMapper],
    });
    const out = capture("stdout");

    await runCliCommand(services, async (handler) => {
      const rows = handler.getClient().listBacklinks("example.com");
      const page = paginateDataset({
        items: rows,
        summary: { domain: "example.com", total: rows.length },
        limit: 2,
        continuation: { bin: "backlink", call: "domain.backlinks", input: { domain: "example.com" } },
      });
      handler.output.success(page);
    });
    out.restore();

    const result = out.json();
    expect(result.ok).toBe(true);
    expect(result.data.items).toHaveLength(2);
    expect(result.data.page.hasMore).toBe(true);
    expect(result.data.page.continuation.argv[0]).toBe("backlink");
  });

  it("maps a provider 401 to auth_error through the error seam (on stderr)", async () => {
    const previousExitCode = process.exitCode;
    const services = createCliServices({
      context: {},
      adapter: backlinkAdapter,
      errorMappers: [backlinkErrorMapper],
    });
    const out = capture("stderr");

    await runCliCommand(services, async () => {
      throw Object.assign(new Error("unauthorized"), { status: 401 });
    });
    out.restore();

    const result = out.json();
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("auth_error");
    process.exitCode = previousExitCode;
  });
});
