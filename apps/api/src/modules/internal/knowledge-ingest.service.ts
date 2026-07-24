import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { loadEnv } from "../../config/env";

export const KNOWLEDGE_INGEST_SUPABASE = Symbol("KNOWLEDGE_INGEST_SUPABASE");

export type SupabaseLike = Pick<SupabaseClient, "from">;

const EMBEDDING_DIMENSIONS = 768;

const KnowledgeChunkSchema = z.object({
  chunkIndex: z.number().int().min(0),
  content: z.string().trim().min(1).max(20_000),
  contentHash: z.string().trim().min(1).max(128),
  embedding: z
    .array(z.number().finite())
    .length(EMBEDDING_DIMENSIONS, "Embedding must have 768 dimensions"),
});

export const ReplaceKnowledgeChunksSchema = z.object({
  orgId: z.string().uuid(),
  sourceType: z.enum(["product", "faq", "policy"]),
  sourceId: z.string().uuid(),
  chunks: z.array(KnowledgeChunkSchema).max(200),
});

export type ReplaceKnowledgeChunksInput = z.output<
  typeof ReplaceKnowledgeChunksSchema
>;

type SupabaseError = {
  code?: string;
  message?: string;
};

@Injectable()
export class KnowledgeIngestService {
  private readonly supabase: SupabaseLike;

  constructor(
    @Optional()
    @Inject(KNOWLEDGE_INGEST_SUPABASE)
    supabase?: SupabaseLike,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
  }

  async replaceChunks(input: ReplaceKnowledgeChunksInput) {
    const { error: deleteError } = await this.supabase
      .from("knowledge_chunks")
      .delete()
      .eq("org_id", input.orgId)
      .eq("source_type", input.sourceType)
      .eq("source_id", input.sourceId);

    if (deleteError) {
      throwKnowledgeError(deleteError, "Could not delete stale knowledge chunks");
    }

    if (input.chunks.length === 0) {
      return {
        ok: true,
        deletedOld: true,
        inserted: 0,
      };
    }

    const now = new Date().toISOString();
    const rows = input.chunks.map((chunk) => ({
      org_id: input.orgId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      content_hash: chunk.contentHash,
      embedding: toPgVector(chunk.embedding),
      updated_at: now,
    }));

    const { error: insertError } = await this.supabase
      .from("knowledge_chunks")
      .insert(rows)
      .select("id");

    if (insertError) {
      throwKnowledgeError(insertError, "Could not insert knowledge chunks");
    }

    return {
      ok: true,
      deletedOld: true,
      inserted: rows.length,
    };
  }
}

export function parseReplaceKnowledgeChunksBody(body: unknown) {
  const parsed = ReplaceKnowledgeChunksSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      code: "invalid_request",
      message: "Request body is invalid",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return parsed.data;
}

function toPgVector(values: number[]) {
  return `[${values.join(",")}]`;
}

function throwKnowledgeError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: "knowledge_ingest_failed",
    message,
  });
}

function createSupabaseServiceClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
