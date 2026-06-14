/**
 * @input dataset items plus limit/cursor request parameters
 * @output opaque-cursor pagination helpers plus validators for agent-facing dataset envelopes
 * @pos CLI dataset paging boundary shared by collection-style handlers
 * @protocol Update header on change, then check AGENTS.md
 */

import {
  array,
  boolean,
  type InferOutput,
  null_,
  number,
  object,
  optional,
  string,
  union,
} from "valibot";

import { buildContinuation, continuationValidator } from "./continuation";
import { cliError } from "./errors";

const defaultDatasetLimit = 50;
const maxDatasetLimit = 100;

type DatasetCursorPayload = {
  offset: number;
};

export const datasetPageValidator = object({
  count: number(),
  nextCursor: union([string(), null_()]),
  hasMore: boolean(),
  continuation: optional(union([continuationValidator, null_()])),
});

export type DatasetPage = InferOutput<typeof datasetPageValidator>;

export type DatasetEnvelope<T, TSummary> = {
  items: T[];
  page: DatasetPage;
  summary: TSummary;
};

type SchemaLike = Parameters<typeof array>[0];

export function createDatasetEnvelopeValidator<
  TItemSchema extends SchemaLike,
  TSummarySchema extends SchemaLike,
>(itemValidator: TItemSchema, summaryValidator: TSummarySchema) {
  return object({
    items: array(itemValidator),
    page: datasetPageValidator,
    summary: summaryValidator,
  });
}

function encodeCursor(payload: DatasetCursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor?: string) {
  if (!cursor) {
    return 0;
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as DatasetCursorPayload;
    if (!Number.isInteger(parsed.offset) || parsed.offset < 0) {
      throw new Error("invalid offset");
    }
    return parsed.offset;
  } catch {
    throw cliError({
      code: "invalid_input",
      message: "Invalid dataset cursor",
      hint: "Use page.continuation or page.nextCursor returned by the previous dataset page.",
    });
  }
}

function normalizeLimit(limit?: number) {
  if (limit === undefined) {
    return defaultDatasetLimit;
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw cliError({
      code: "invalid_input",
      message: "Dataset limit must be a positive integer",
    });
  }
  if (limit > maxDatasetLimit) {
    throw cliError({
      code: "invalid_input",
      message: `Dataset limit must be <= ${maxDatasetLimit}`,
    });
  }
  return limit;
}

export function paginateDataset<T, TSummary>(input: {
  items: T[];
  summary: TSummary;
  limit?: number;
  cursor?: string;
  continuation?: {
    bin: string;
    call: string;
    input: Record<string, unknown>;
  };
}): DatasetEnvelope<T, TSummary> {
  const offset = decodeCursor(input.cursor);
  const limit = normalizeLimit(input.limit);
  const items = input.items.slice(offset, offset + limit);
  const nextOffset = offset + items.length;
  const hasMore = nextOffset < input.items.length;
  const nextCursor = hasMore ? encodeCursor({ offset: nextOffset }) : null;

  return {
    items,
    page: {
      count: items.length,
      nextCursor,
      hasMore,
      continuation:
        hasMore && nextCursor && input.continuation
          ? buildContinuation({
              bin: input.continuation.bin,
              call: input.continuation.call,
              payload: {
                ...input.continuation.input,
                cursor: nextCursor,
              },
            })
          : null,
    },
    summary: input.summary,
  };
}
