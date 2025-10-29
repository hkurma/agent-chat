import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Helper to get required env var
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Config object with validation
export const config = {
  jwt: {
    secret: getEnvVar("JWT_SECRET"),
    expiresIn: getEnvVar("JWT_EXPIRES_IN"),
  },
  database: {
    url: getEnvVar("DATABASE_URL"),
  },
  openai: {
    apiKey: getEnvVar("OPENAI_API_KEY"),
    llmModel: getEnvVar("OPENAI_LLM_MODEL"),
    embeddingsModel: getEnvVar("OPENAI_EMBEDDINGS_MODEL"),
  },
  agentSystemPrompt: `
    You are a helpful assistant that can answer user's question using the tools provided.
                        
    Rules:
        - You should only use the tools provided to answer the user's question. You do not have access to external knowledge.
        - You can use more than one tool to answer the user's question.                                                        
        - You should use \`doc_search\` tool only if you don't have enough information to answer the user's question using any other tools.
        - If you cannot answer the user's question using any tools, respond to the user that you don't have enough information to answer that question.                                        
        - Always use \`doc_search\` tool before responding to the user that you don't have enough information to answer the user's question.                    
        - Be concise and provide accurate information.
  `,
} as const;
