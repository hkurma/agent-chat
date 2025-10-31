import { DocumentChunk } from "@prisma/client";
import { tool } from "langchain";
import * as z from "zod";
import { createEmbeddings } from "../services/embeddings";
import db from "../services/database";

export const docSearch = tool(
  async ({ query }: { query: string }) => {
    // Generate embeddings for the search query
    const queryEmbeddings = (await createEmbeddings([query]))[0];

    // Format embedding as a vector string for pgvector
    const embeddingStr = `[${queryEmbeddings.join(",")}]`;

    // Use raw SQL to find similar chunks using pgvector cosine distance operator
    // The <=> operator calculates cosine distance (lower is more similar)
    const relevantChunks = await db.$queryRaw<DocumentChunk[]>`
        SELECT id, document_id as "documentId", chunk_text as "chunkText", 
               chunk_index as "chunkIndex", created_at as "createdAt",
               (embedding <=> ${embeddingStr}::vector) as distance
        FROM document_chunks
        ORDER BY distance
        LIMIT 1
      `;

    if (relevantChunks.length === 0) {
      return "No relevant information found.";
    }

    return relevantChunks
      .map((chunk: DocumentChunk) => chunk.chunkText)
      .join("\n\n---\n\n");
  },
  {
    name: "doc_search",
    description: "Search for relevant information in the documents",
    schema: z.object({
      query: z.string({ description: "The query to search for" }),
    }),
  }
);
