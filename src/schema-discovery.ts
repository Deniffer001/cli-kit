/**
 * @input a root-level argv plus an argc schema and its renderers
 * @output the `--schema [selector]` agent-discovery behavior: full outline, or a jq-selected subset
 * @pos schema-discovery boundary that turns a CLI into a self-describing surface for agents
 * @protocol Update header on change, then check AGENTS.md
 */

import type { Router } from "argc";

import { buildSchemaSubset, matchSchemaSelector, parseSchemaSelector } from "./schema-selector";

export type ParsedArgvLike = {
  positionals: string[];
  flags: Record<string, unknown>;
};

export type ExpandSchemaInput = {
  schema: Router;
  argv: ParsedArgvLike;
  /** Render a (sub)schema to a full schema string — wire argc's `generateSchema`. */
  renderSchema: (subset: Router) => string;
  /** Render a compact outline — wire argc's `generateSchemaOutline`. */
  renderOutline: (subset: Router, depth: number) => string[];
  maxLines?: number;
  depth?: number;
};

/**
 * If this is a root-level `--schema [selector]` request, returns the lines to print;
 * otherwise returns null so the caller can continue to normal command dispatch.
 *
 * The selector grammar is jq-like: `.path`, `*`, `{a,b}`, `..name`. When the rendered
 * schema exceeds `maxLines`, it falls back to a compact outline so agents are never
 * flooded.
 */
export function expandSchemaSelector(input: ExpandSchemaInput): string[] | null {
  const depth = input.depth ?? 2;
  const maxLines = input.maxLines ?? 100;

  if (input.argv.positionals.length > 0) {
    return null;
  }

  const flag = input.argv.flags.schema;
  if (flag === true) {
    return input.renderOutline(input.schema, depth);
  }

  if (typeof flag !== "string" || flag.length === 0) {
    return null;
  }

  const matches = matchSchemaSelector(input.schema, parseSchemaSelector(flag));
  const subset = buildSchemaSubset(input.schema, matches, depth);
  const lines = input.renderSchema(subset).split("\n");

  if (lines.length > maxLines) {
    return [
      `Schema too large (${lines.length} lines). Showing compact outline.`,
      "",
      ...input.renderOutline(subset, depth),
      "",
      "hint: selector is jq-like (path, *, {a,b}, ..name)",
    ];
  }

  return lines;
}
