import { describe, expect, it } from "bun:test";

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { object, string } from "valibot";

import { defineProfile } from "./profile";

function setupRoot() {
  const root = mkdtempSync(resolve(tmpdir(), "cli-kit-profile-"));
  const dir = resolve(root, "acme", "dev");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "demo.env"), "API_URL=https://api.example.com\nAPI_KEY=secret\n");
  return root;
}

function loaderFor(root: string) {
  return defineProfile({
    app: "demo",
    fileName: "demo.env",
    envs: ["dev", "prod"],
    configRoot: root,
    schema: object({ API_URL: string(), API_KEY: string() }),
  });
}

describe("defineProfile", () => {
  it("loads and validates a profile env file", () => {
    const profile = loaderFor(setupRoot()).load({ profile: "acme", env: "dev" });

    expect(profile.name).toBe("acme");
    expect(profile.env).toBe("dev");
    expect(profile.values.API_URL).toBe("https://api.example.com");
    expect(profile.values.API_KEY).toBe("secret");
  });

  it("rejects an env outside the allow-list", () => {
    expect(() => loaderFor(setupRoot()).load({ profile: "acme", env: "staging" })).toThrowError(/Unknown demo env/);
  });

  it("errors when the profile name is missing", () => {
    expect(() => loaderFor(setupRoot()).load({ env: "dev" })).toThrowError(/Missing demo profile/);
  });

  it("rejects path-traversal profile names", () => {
    expect(() => loaderFor(setupRoot()).load({ profile: "../escape", env: "dev" })).toThrow();
  });
});
