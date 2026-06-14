import { describe, expect, it } from "bun:test";

import type { Router } from "argc";
import { buildSchemaSubset, matchSchemaSelector, parseSchemaSelector } from "./schema-selector";

// Plain nested objects are valid argc Routers (a child map), which lets us
// exercise selection without constructing real argc commands/groups.
const schema = {
  user: { list: {}, get: {} },
  billing: { sync: {}, report: {} },
} as unknown as Router;

describe("parseSchemaSelector", () => {
  it("parses chained key steps", () => {
    expect(parseSchemaSelector(".user.list")).toEqual([
      { type: "key", name: "user" },
      { type: "key", name: "list" },
    ]);
  });

  it("parses wildcards", () => {
    expect(parseSchemaSelector(".user.*")).toEqual([
      { type: "key", name: "user" },
      { type: "wildcard" },
    ]);
  });

  it("parses sets with whitespace", () => {
    expect(parseSchemaSelector(".{user, billing}")).toEqual([{ type: "set", names: ["user", "billing"] }]);
  });

  it("parses a recursive descent step", () => {
    expect(parseSchemaSelector("..list")).toEqual([{ type: "recursive" }, { type: "key", name: "list" }]);
  });

  it("rejects selectors that do not start with a dot", () => {
    expect(() => parseSchemaSelector("user")).toThrow();
  });
});

describe("matchSchemaSelector", () => {
  it("expands a wildcard under a key", () => {
    const matches = matchSchemaSelector(schema, parseSchemaSelector(".user.*"));
    expect(matches.map((match) => match.path.join("."))).toEqual(["user.list", "user.get"]);
  });

  it("selects an explicit set", () => {
    const matches = matchSchemaSelector(schema, parseSchemaSelector(".{user, billing}"));
    expect(matches.map((match) => match.path.join("."))).toEqual(["user", "billing"]);
  });

  it("finds nodes recursively", () => {
    const matches = matchSchemaSelector(schema, parseSchemaSelector("..list"));
    expect(matches.some((match) => match.path.join(".") === "user.list")).toBe(true);
  });
});

describe("buildSchemaSubset", () => {
  it("returns only the matched branch", () => {
    const matches = matchSchemaSelector(schema, parseSchemaSelector(".billing"));
    const subset = buildSchemaSubset(schema, matches, 2) as Record<string, Router>;
    expect(Object.keys(subset)).toEqual(["billing"]);
  });

  it("returns an empty router when nothing matches", () => {
    const subset = buildSchemaSubset(schema, [], 2) as Record<string, Router>;
    expect(subset).toEqual({});
  });
});
