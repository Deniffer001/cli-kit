import { describe, expect, it } from "bun:test";

import { runCliCommand } from "./command";
import { cliError } from "./errors";
import { createCliServices } from "./services";

function silentServices() {
  const services = createCliServices({ context: {}, adapter: () => null });
  const errors: unknown[] = [];
  services.output.error = (error: unknown) => {
    errors.push(error);
  };
  services.output.success = () => {};
  return { services, errors };
}

describe("runCliCommand", () => {
  it("runs the handler and leaves the exit code untouched on success", async () => {
    const previous = process.exitCode;
    process.exitCode = 0;
    const { services } = silentServices();
    let ran = false;

    await runCliCommand(services, async () => {
      ran = true;
    });

    expect(ran).toBe(true);
    expect(process.exitCode).toBe(0);
    process.exitCode = previous;
  });

  it("serializes the error and sets a non-zero exit code on failure", async () => {
    const previous = process.exitCode;
    process.exitCode = 0;
    const { services, errors } = silentServices();

    await runCliCommand(services, async () => {
      throw cliError({ code: "not_found", message: "nope" });
    });

    expect(errors).toHaveLength(1);
    expect(process.exitCode).toBe(1);
    process.exitCode = previous;
  });
});
