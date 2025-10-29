import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "../config";

const embeddings = new OpenAIEmbeddings({
  model: config.openai.embeddingsModel,
});

// Create embeddings
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  return await embeddings.embedDocuments(texts);
}
