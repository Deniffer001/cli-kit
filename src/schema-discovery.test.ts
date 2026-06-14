import { describe, expect, it } from "bun:test";

import type { Router } from "argc";
import { expandSchemaSelector } from "./schema-discovery";

const schema = {
  user: { list: {}, get: {} },
  billing: { sync: {} },
} as unknown as Router;

const renderSchema = (subset: Router) => JSON.stringify(subset);
const renderOutline = (_subset: Router, _depth: number) => ["<outline>"];

describe("expandSchemaSelector", () => {
  it("returns null when not a root-level schema request", () => {
    expect(
      expandSchemaSelector({ schema, argv: { positionals: ["user"], flags: { schema: true } }, renderSchema, renderOutline }),
    ).toBeNull();
    expect(
      expandSchemaSelector({ schema, argv: { positionals: [], flags: {} }, renderSchema, renderOutline }),
    ).toBeNull();
  });

  it("renders the outline for a bare --schema flag", () => {
    const out = expandSchemaSelector({
      schema,
      argv: { positionals: [], flags: { schema: true } },
      renderSchema,
      renderOutline,
    });
    expect(out).toEqual(["<outline>"]);
  });

  it("renders a jq-selected subset for --schema <selector>", () => {
    const out = expandSchemaSelector({
      schema,
      argv: { positionals: [], flags: { schema: ".billing" } },
      renderSchema,
      renderOutline,
    });
    expect(out).not.toBeNull();
    expect(JSON.parse((out as string[]).join("\n"))).toEqual({ billing: { sync: {} } });
  });

  it("falls back to the outline when the rendered schema exceeds maxLines", () => {
    const out = expandSchemaSelector({
      schema,
      argv: { positionals: [], flags: { schema: ".user" } },
      renderSchema: () => "a\nb\nc\nd",
      renderOutline,
      maxLines: 2,
    });
    expect(out?.[0]).toContain("Schema too large");
    expect(out).toContain("<outline>");
  });
});
