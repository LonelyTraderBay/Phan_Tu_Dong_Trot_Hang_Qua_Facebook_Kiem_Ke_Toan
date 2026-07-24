import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { loadEnv } from "../../config/env";

export const KNOWLEDGE_INGEST_SUPABASE = Symbol("KNOWLEDGE_INGEST_SUPABASE");

export type SupabaseLike = Pick<SupabaseClient, "from" | "rpc">;

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
    await this.verifySourceOwnership(input);

    const chunks = input.chunks.map((chunk) => ({
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      content_hash: chunk.contentHash,
      embedding: toPgVector(chunk.embedding),
    }));

    const { data, error } = await this.supabase.rpc("replace_knowledge_chunks", {
      p_org_id: input.orgId,
      p_source_type: input.sourceType,
      p_source_id: input.sourceId,
      p_chunks: chunks,
    });

    if (error) {
      if (error.code === "P0002") {
        throwSourceNotFound(input);
      }
      throwKnowledgeError(error, "Could not replace knowledge chunks");
    }

    return data ?? { ok: true, deletedOld: true, inserted: chunks.length };
  }

  private async verifySourceOwnership(input: ReplaceKnowledgeChunksInput) {
    if (input.sourceType !== "product") {
      return;
    }

    const { data: product, error } = await this.supabase
      .from("products")
      .select("id")
      .eq("id", input.sourceId)
      .eq("org_id", input.orgId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwKnowledgeError(error, "Could not verify knowledge source ownership");
    }
    if (!product) {
      throwSourceNotFound(input);
    }
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

function throwSourceNotFound(input: ReplaceKnowledgeChunksInput): never {
  throw new NotFoundException({
    code: "knowledge_source_not_found",
    message: `${input.sourceType} source was not found for this organization`,
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
