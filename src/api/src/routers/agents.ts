import { Router, Request, Response } from "express";
import db from "../services/database";
import multer from "multer";
import { createEmbeddings } from "../services/embeddings";
import { extractTextFromFile, splitText } from "../utils/text";
import {
  OpenAPISpec,
  parseOpenAPIToToolsSchema,
  ToolSchema,
} from "../utils/openapi";
import { createAgent, Tool, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config";
import { docSearch } from "../tools/doc_search";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { ErrorCode } from "../error";
import { APIError } from "../error";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MCP } from "@prisma/client";

// Router for agents
const router = Router();

// Create agent
router.post("/", async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) throw new APIError(ErrorCode.INVALID_REQUEST);

  const agent = await db.agent.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      userId: req.userId,
    },
  });

  return res.status(201).json(agent);
});

// List all agents
router.get("/", async (req: Request, res: Response) => {
  const agents = await db.agent.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });

  return res.json(agents);
});

// Get agent details
router.get("/:id", async (req: Request, res: Response) => {
  const agent = await db.agent.findUnique({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  return res.json(agent);
});

// Update an agent
router.patch("/:id", async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const existingAgent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!existingAgent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  const updatedAgent = await db.agent.update({
    where: { id: req.params.id },
    data: {
      name: name?.trim() || undefined,
      description: description?.trim() || undefined,
    },
  });

  return res.json(updatedAgent);
});

// Delete an agent
router.delete("/:id", async (req: Request, res: Response) => {
  const existingAgent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!existingAgent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  await db.agent.delete({
    where: { id: req.params.id },
  });

  return res.status(204).send();
});

// Upload document for an agent
const upload = multer();
router.post(
  "/:id/documents",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) throw new APIError(ErrorCode.INVALID_REQUEST);

    const { originalname, mimetype, size, buffer } = req.file;

    // Verify agent belongs to user
    const agent = await db.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

    // Parse document
    const docText = await extractTextFromFile(buffer, mimetype);

    // split text into chunks
    const chunks = await splitText(docText);

    // Create embeddings for chunks
    const embeddings = await createEmbeddings(chunks);

    // Save document to database with chunks in a single transaction
    const document = await db.$transaction(async (tx) => {
      // Create the document
      const doc = await tx.document.create({
        data: {
          name: originalname,
          type: mimetype,
          size: size,
          agentId: agent.id,
        },
      });

      // Insert document chunks with embeddings using raw query
      if (chunks.length > 0 && embeddings.length > 0) {
        const params: any[] = [];
        const values = chunks
          .map((chunk, index) => {
            params.push(chunk); // chunk text as parameter
            const embeddingArray = `[${embeddings[index].join(",")}]`;
            return `(gen_random_uuid(), '${doc.id}', $${params.length}, ${index}, '${embeddingArray}'::vector, NOW())`;
          })
          .join(", ");

        await tx.$executeRawUnsafe(
          `INSERT INTO document_chunks (id, document_id, chunk_text, chunk_index, embedding, created_at) VALUES ${values}`,
          ...params
        );
      }

      return doc;
    });

    return res.status(201).json(document);
  }
);

// List documents for an agent
router.get("/:id/documents", async (req: Request, res: Response) => {
  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  // Get documents for the agent
  const documents = await db.document.findMany({
    where: { agentId: req.params.id },
    orderBy: { createdAt: "desc" },
  });

  return res.json(documents);
});

// Delete a document for an agent
router.delete(
  "/:id/documents/:documentId",
  async (req: Request, res: Response) => {
    // Verify agent belongs to user
    const agent = await db.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

    // Delete document of an agent
    await db.document.delete({
      where: {
        id: req.params.documentId,
        agentId: req.params.id,
      },
    });

    return res.status(204).send();
  }
);

// Create a new OpenAPI integration for an agent
router.post("/:id/openapis", async (req: Request, res: Response) => {
  const { name, schemaUrl, apiUrl } = req.body;

  if (!name?.trim() || !apiUrl?.trim() || !schemaUrl?.trim())
    throw new APIError(ErrorCode.INVALID_REQUEST);

  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  // Fetch schema from URL
  const schema = await fetch(schemaUrl);
  if (!schema.ok) throw new APIError(ErrorCode.INVALID_REQUEST);
  const schemaJson = await schema.json();

  // Parse schema to generate tools schema
  const toolsSchema = parseOpenAPIToToolsSchema(schemaJson as OpenAPISpec);

  // Save OpenAPI integration for the agent
  const openapi = await db.openAPI.create({
    data: {
      name: name.trim(),
      schemaUrl: schemaUrl.trim(),
      apiUrl: apiUrl.trim(),
      toolsSchema: toolsSchema as unknown as InputJsonValue,
      agentId: agent.id,
    },
  });

  return res.status(201).json(openapi);
});

// List all OpenAPI integrations for an agent
router.get("/:id/openapis", async (req: Request, res: Response) => {
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  const openapis = await db.openAPI.findMany({
    where: { agentId: req.params.id },
    orderBy: { createdAt: "desc" },
  });

  return res.json(openapis);
});

// Get OpenAPI details for an Agent
router.get("/:id/openapis/:openapiId", async (req: Request, res: Response) => {
  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  const openapi = await db.openAPI.findUnique({
    where: {
      id: req.params.openapiId,
      agentId: req.params.id,
    },
  });

  if (!openapi) throw new APIError(ErrorCode.OPENAPI_NOT_FOUND);

  return res.json(openapi);
});

// Update OpenAPI integration for an agent
router.patch(
  "/:id/openapis/:openapiId",
  async (req: Request, res: Response) => {
    const { name, schemaUrl, apiUrl } = req.body;

    // Verify agent belongs to user
    const agent = await db.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

    // Fetch schema from URL
    let toolsSchema: ToolSchema[] | undefined;
    if (schemaUrl) {
      const schema = await fetch(schemaUrl);
      if (!schema.ok) throw new APIError(ErrorCode.INVALID_REQUEST);
      const schemaJson = await schema.json();
      toolsSchema = parseOpenAPIToToolsSchema(schemaJson as OpenAPISpec);
    }

    // Update OpenAPI integration
    const openapi = await db.openAPI.update({
      where: { id: req.params.openapiId, agentId: agent.id },
      data: {
        name: name?.trim() || undefined,
        schemaUrl: schemaUrl?.trim() || undefined,
        toolsSchema: toolsSchema
          ? (toolsSchema as unknown as InputJsonValue)
          : undefined,
        apiUrl: apiUrl?.trim() || undefined,
      },
    });

    // Return updated OpenAPI integration
    return res.json(openapi);
  }
);

// Delete OpenAPI integration for an agent
router.delete(
  "/:id/openapis/:openapiId",
  async (req: Request, res: Response) => {
    // Verify agent belongs to user
    const agent = await db.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

    // Delete OpenAPI integration
    await db.openAPI.delete({
      where: { id: req.params.openapiId, agentId: req.params.id },
    });

    return res.status(204).send();
  }
);

// Create a new MCP server for an agent
router.post("/:id/mcps", async (req: Request, res: Response) => {
  const { name, transport, url } = req.body;

  if (!name?.trim() || !transport?.trim() || !url?.trim())
    throw new APIError(ErrorCode.INVALID_REQUEST);

  // Validate transport type (only SSE and HTTP supported)
  if (!["sse", "http"].includes(transport))
    throw new APIError(ErrorCode.INVALID_REQUEST);

  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  // Save MCP server for the agent
  const mcp = await db.mCP.create({
    data: {
      name: name.trim(),
      transport: transport.trim(),
      url: url.trim(),
      agentId: agent.id,
    },
  });

  return res.status(201).json(mcp);
});

// List all MCP servers for an agent
router.get("/:id/mcps", async (req: Request, res: Response) => {
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  const mcps = await db.mCP.findMany({
    where: { agentId: req.params.id },
    orderBy: { createdAt: "desc" },
  });

  return res.json(mcps);
});

// Get MCP server details for an Agent
router.get("/:id/mcps/:mcpId", async (req: Request, res: Response) => {
  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  const mcp = await db.mCP.findUnique({
    where: {
      id: req.params.mcpId,
      agentId: req.params.id,
    },
  });

  if (!mcp) throw new APIError(ErrorCode.MCP_NOT_FOUND);

  return res.json(mcp);
});

// Update MCP server for an agent
router.patch("/:id/mcps/:mcpId", async (req: Request, res: Response) => {
  const { name, transport, url } = req.body;

  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  // Validate transport type if provided (only SSE and HTTP supported)
  if (transport && !["sse", "http"].includes(transport))
    throw new APIError(ErrorCode.INVALID_REQUEST);

  // Update MCP server
  const mcp = await db.mCP.update({
    where: { id: req.params.mcpId, agentId: agent.id },
    data: {
      name: name?.trim() || undefined,
      transport: transport?.trim() || undefined,
      url: url?.trim() || undefined,
    },
  });

  return res.json(mcp);
});

// Delete MCP server for an agent
router.delete("/:id/mcps/:mcpId", async (req: Request, res: Response) => {
  // Verify agent belongs to user
  const agent = await db.agent.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!agent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  await db.mCP.delete({
    where: { id: req.params.mcpId, agentId: agent.id },
  });

  return res.status(204).send();
});

// Chat with an agent (streaming)
router.post("/:id/chat", async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || !message.trim())
    throw new APIError(ErrorCode.INVALID_REQUEST);

  // Verify agent belongs to user
  const userAgent = await db.agent.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });

  if (!userAgent) throw new APIError(ErrorCode.AGENT_NOT_FOUND);

  // Get openapi integrations for the agent
  const openapis = await db.openAPI.findMany({
    where: { agentId: req.params.id },
  });

  // Get MCP servers for the agent
  const mcps = await db.mCP.findMany({
    where: { agentId: req.params.id },
  });

  // Create langchain tools for the agent
  const tools: Tool[] = [];

  // Add OpenAPI tools
  openapis.forEach((openapi) => {
    (openapi.toolsSchema as unknown as ToolSchema[]).forEach(
      (toolSchema: ToolSchema) => {
        tools.push(
          tool(
            async (args: any) => {
              const params = new URLSearchParams(args);
              const response = await fetch(
                `${openapi.apiUrl}${toolSchema._meta.path}?${params}`
              );
              const data = await response.json();
              return JSON.stringify(data);
            },
            {
              name: toolSchema.function.name,
              description: toolSchema.function.description,
              schema: toolSchema.function.parameters,
            }
          )
        );
      }
    );
  });

  // Add MCP tools
  const mcpConfig: Record<string, any> = {};
  mcps.forEach((mcp: MCP) => {
    mcpConfig[mcp.name] = {
      transport: mcp.transport,
      url: mcp.url,
    };
  });
  if (Object.keys(mcpConfig).length > 0) {
    const mcpClient = new MultiServerMCPClient(mcpConfig);
    const mcpTools = await mcpClient.getTools();
    tools.push(...mcpTools);
  }

  const agent = createAgent({
    model: new ChatOpenAI({
      model: config.openai.llmModel,
      apiKey: config.openai.apiKey,
    }),
    tools: [...tools, docSearch],
    systemPrompt: config.agentSystemPrompt,
  });

  // Set headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Helper function to send stream events
  const sendEvent = (eventType: string, data: any) => {
    res.write(`${JSON.stringify({ type: eventType, ...data })}\n`);
  };

  // Start streaming agent responses
  const stream = await agent.stream(
    { messages: [{ role: "user", content: message }] },
    { streamMode: ["updates", "messages"] }
  );

  for await (const [streamMode, chunk] of stream) {
    if (streamMode === "updates") {
      handleAgentUpdates(chunk, sendEvent);
    } else if (streamMode === "messages") {
      handleMessageTokens(chunk, sendEvent);
    }
  }

  // Stream complete
  sendEvent("done", {});

  res.end();
});

// Handle agent step updates (tool calls and results)
function handleAgentUpdates(
  chunk: any,
  sendEvent: (type: string, data: any) => void
) {
  const [stepName, stepContent] = Object.entries(
    chunk as Record<string, any>
  )[0];

  if (!stepContent?.messages?.length) return;

  const lastMessage = stepContent.messages[stepContent.messages.length - 1];

  // Handle tool calls
  if (lastMessage.tool_calls?.length > 0) {
    lastMessage.tool_calls.forEach((toolCall: any) => {
      sendEvent("tool_call", {
        tool: toolCall.name,
        args: toolCall.args,
        id: toolCall.id,
      });
    });
    return;
  }

  // Handle tool results
  if (stepName === "tools" && lastMessage.name && lastMessage.content) {
    sendEvent("tool_result", {
      tool: lastMessage.name,
      content: lastMessage.content,
    });
  }
}

// Handle LLM token streaming
function handleMessageTokens(
  chunk: any,
  sendEvent: (type: string, data: any) => void
) {
  const [token, metadata] = chunk;

  // Only stream from model nodes
  const isModelNode =
    metadata?.langgraph_node?.includes("model") || !metadata?.langgraph_node;
  if (!isModelNode) return;

  // Extract token content
  const tokenText = extractTokenText(token);
  if (tokenText) {
    sendEvent("token", { content: tokenText });
  }
}

// Extract text content from token
function extractTokenText(token: any): string | null {
  // Check contentBlocks
  if (token?.contentBlocks?.length > 0) {
    for (const block of token.contentBlocks) {
      if (block?.text) return block.text;
    }
  }

  // Check direct content
  if (token?.content && typeof token.content === "string") {
    return token.content;
  }

  return null;
}

export default router;
