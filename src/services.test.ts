import { describe, expect, it } from "bun:test";

import { defineClientAdapter } from "./client";
import { createCliServices } from "./services";

describe("createCliServices", () => {
  it("builds the client lazily and memoizes it", () => {
    let calls = 0;
    const adapter = defineClientAdapter(() => {
      calls += 1;
      return { id: calls };
    });
    const services = createCliServices({ context: {}, adapter });

    expect(calls).toBe(0);
    const first = services.getClient();
    const second = services.getClient();

    expect(calls).toBe(1);
    expect(first).toBe(second);
  });

  it("exposes the context and a pretty-aware output service", () => {
    const services = createCliServices({ context: { pretty: true }, adapter: () => null });

    expect(services.context.pretty).toBe(true);
    expect(typeof services.output.success).toBe("function");
  });
});
