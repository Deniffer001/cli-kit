import { describe, expect, it } from "bun:test";

import { number, object, parse } from "valibot";
import { createDatasetEnvelopeValidator, paginateDataset } from "./dataset-pagination";

const items = Array.from({ length: 5 }, (_value, index) => ({ id: index }));

describe("paginateDataset", () => {
  it("returns the first page and a next cursor when more remain", () => {
    const page = paginateDataset({ items, summary: { total: 5 }, limit: 2 });

    expect(page.items).toEqual([{ id: 0 }, { id: 1 }]);
    expect(page.page.count).toBe(2);
    expect(page.page.hasMore).toBe(true);
    expect(typeof page.page.nextCursor).toBe("string");
  });

  it("round-trips the cursor to the next slice", () => {
    const first = paginateDataset({ items, summary: {}, limit: 2 });
    const second = paginateDataset({
      items,
      summary: {},
      limit: 2,
      cursor: first.page.nextCursor ?? undefined,
    });

    expect(second.items).toEqual([{ id: 2 }, { id: 3 }]);
  });

  it("closes the page when the dataset is exhausted", () => {
    const page = paginateDataset({ items, summary: {}, limit: 10 });

    expect(page.page.hasMore).toBe(false);
    expect(page.page.nextCursor).toBeNull();
  });

  it("rejects an invalid cursor with invalid_input", () => {
    expect(() => paginateDataset({ items, summary: {}, cursor: "%%%not-a-cursor%%%" })).toThrowError(
      /Invalid dataset cursor/,
    );
  });

  it("attaches a replayable argc continuation when a call is provided", () => {
    const page = paginateDataset({
      items,
      summary: {},
      limit: 2,
      continuation: { bin: "mycli", call: "user.list", input: { active: true } },
    });

    expect(page.page.continuation?.argv[0]).toBe("mycli");
    expect(page.page.continuation?.call).toBe("user.list");
    expect(page.page.continuation?.input.cursor).toBe(page.page.nextCursor);
  });
});

describe("createDatasetEnvelopeValidator", () => {
  it("accepts a well-formed envelope", () => {
    const validator = createDatasetEnvelopeValidator(object({ id: number() }), object({ total: number() }));
    const page = paginateDataset({ items: [{ id: 1 }], summary: { total: 1 }, limit: 5 });

    expect(() => parse(validator, page)).not.toThrow();
  });
});
