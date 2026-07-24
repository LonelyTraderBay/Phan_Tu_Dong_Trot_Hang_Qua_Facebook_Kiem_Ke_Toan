import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import {
  KnowledgeIngestService,
  parseReplaceKnowledgeChunksBody,
  type SupabaseLike,
} from "./knowledge-ingest.service";

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const SOURCE_ID = "22222222-2222-2222-2222-222222222222";

type SupabaseCall = {
  op: string;
  table?: string;
  values?: unknown;
  field?: string;
  value?: unknown;
};

function mockSupabase() {
  const calls: SupabaseCall[] = [];
  let deleteEqCalls = 0;
  const client = {
    from(table: string) {
      return {
        delete() {
          calls.push({ op: "delete", table });
          const query = {
            eq(field: string, value: unknown) {
              calls.push({ op: "eq", field, value });
              deleteEqCalls += 1;
              return deleteEqCalls === 3
                ? Promise.resolve({ data: null, error: null })
                : query;
            },
          };
          return query;
        },
        insert(values: unknown) {
          calls.push({ op: "insert", table, values });
          return {
            select: async () => ({ data: [{ id: "chunk_1" }], error: null }),
          };
        },
      };
    },
  } as unknown as SupabaseLike;

  return { calls, client };
}

describe("KnowledgeIngestService", () => {
  it("deletes stale chunks and inserts replacement chunks", async () => {
    const { calls, client } = mockSupabase();
    const service = new KnowledgeIngestService(client);
    const embedding = Array.from({ length: 768 }, () => 0.01);

    await expect(
      service.replaceChunks({
        orgId: ORG_ID,
        sourceType: "product",
        sourceId: SOURCE_ID,
        chunks: [
          {
            chunkIndex: 0,
            content: "Product\nTitle: T-shirt",
            contentHash: "abc123",
            embedding,
          },
        ],
      }),
    ).resolves.toMatchObject({ ok: true, inserted: 1 });

    expect(calls).toContainEqual({ op: "delete", table: "knowledge_chunks" });
    expect(calls).toContainEqual({ op: "eq", field: "org_id", value: ORG_ID });
    expect(calls).toContainEqual({
      op: "eq",
      field: "source_type",
      value: "product",
    });
    expect(calls).toContainEqual({
      op: "insert",
      table: "knowledge_chunks",
      values: [
        expect.objectContaining({
          org_id: ORG_ID,
          source_type: "product",
          source_id: SOURCE_ID,
          chunk_index: 0,
          content_hash: "abc123",
          embedding: `[${embedding.join(",")}]`,
        }),
      ],
    });
  });

  it("rejects embeddings with the wrong dimension", () => {
    expect(() =>
      parseReplaceKnowledgeChunksBody({
        orgId: ORG_ID,
        sourceType: "product",
        sourceId: SOURCE_ID,
        chunks: [
          {
            chunkIndex: 0,
            content: "Product",
            contentHash: "abc123",
            embedding: [0.1],
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });
});
