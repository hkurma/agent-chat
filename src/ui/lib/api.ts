import { config } from "./config";
import { getToken, removeToken } from "./auth";

// API client utility
export class APIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 Unauthorized - remove token and redirect to sign-in
      if (response.status === 401) {
        removeToken();
        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }
      }

      // Handle error response
      const responseData = await response.json().catch(() => ({}));
      throw new Error(responseData.error);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async checkUser(email: string): Promise<{ hasPassword: boolean }> {
    const response = await fetch(`${this.baseUrl}/auth/check-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse(response);
  }

  async createPassword(
    email: string,
    password: string
  ): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/create-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async validatePassword(
    email: string,
    password: string
  ): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/validate-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  // User endpoints
  async getCurrentUser(): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }> {
    const response = await fetch(`${this.baseUrl}/users/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Agent endpoints
  async createAgent(name: string, description?: string): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/agents`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    });
    return this.handleResponse(response);
  }

  async listAgents(): Promise<Agent[]> {
    const response = await fetch(`${this.baseUrl}/agents`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/agents/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateAgent(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/agents/${id}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteAgent(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/agents/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Document endpoints
  async uploadDocument(agentId: string, file: File): Promise<Document> {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/documents`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );
    return this.handleResponse(response);
  }

  async listDocuments(agentId: string): Promise<Document[]> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/documents`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async deleteDocument(agentId: string, documentId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/documents/${documentId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // OpenAPI endpoints
  async createOpenAPI(
    agentId: string,
    data: { name: string; schemaUrl: string; apiUrl: string }
  ): Promise<OpenAPI> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/openapis`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async listOpenAPIs(agentId: string): Promise<OpenAPI[]> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/openapis`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getOpenAPI(agentId: string, openapiId: string): Promise<OpenAPI> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/openapis/${openapiId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateOpenAPI(
    agentId: string,
    openapiId: string,
    data: { name?: string; schemaUrl?: string; apiUrl?: string }
  ): Promise<OpenAPI> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/openapis/${openapiId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async deleteOpenAPI(agentId: string, openapiId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/openapis/${openapiId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // MCP server endpoints
  async createMCP(
    agentId: string,
    data: {
      name: string;
      transport: "sse" | "http";
      url: string;
    }
  ): Promise<MCP> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/mcps`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getMCPs(agentId: string): Promise<MCP[]> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/mcps`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getMCP(agentId: string, mcpId: string): Promise<MCP> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/mcps/${mcpId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateMCP(
    agentId: string,
    mcpId: string,
    data: {
      name?: string;
      transport?: "sse" | "http";
      url?: string;
    }
  ): Promise<MCP> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/mcps/${mcpId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async deleteMCP(agentId: string, mcpId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/mcps/${mcpId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Chat endpoint (streaming with tool progress)
  async chatStream(
    agentId: string,
    message: string,
    onToolCall: (
      tool: string,
      args: Record<string, unknown>,
      id: string
    ) => void,
    onToolResult: (tool: string, content: string) => void,
    onContent: (content: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await this.fetchStream(agentId, message);
      await this.processStream(response.body!, {
        onToolCall,
        onToolResult,
        onContent,
        onComplete,
        onError,
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Stream error");
    }
  }

  private async fetchStream(
    agentId: string,
    message: string
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/chat`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response stream");
    }

    return response;
  }

  private async processStream(
    body: ReadableStream<Uint8Array>,
    handlers: {
      onToolCall: (
        tool: string,
        args: Record<string, unknown>,
        id: string
      ) => void;
      onToolResult: (tool: string, content: string) => void;
      onContent: (content: string) => void;
      onComplete: () => void;
      onError: (error: string) => void;
    }
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          this.handleStreamEvent(line, handlers);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private handleStreamEvent(
    line: string,
    handlers: {
      onToolCall: (
        tool: string,
        args: Record<string, unknown>,
        id: string
      ) => void;
      onToolResult: (tool: string, content: string) => void;
      onContent: (content: string) => void;
      onComplete: () => void;
      onError: (error: string) => void;
    }
  ): void {
    try {
      const event = JSON.parse(line);

      switch (event.type) {
        case "tool_call":
          handlers.onToolCall(event.tool, event.args, event.id);
          break;

        case "tool_result":
          handlers.onToolResult(event.tool, event.content);
          break;

        case "token":
        case "content":
          handlers.onContent(event.content);
          break;

        case "done":
          handlers.onComplete();
          break;

        case "error":
          console.error("❌ Error:", event.error);
          handlers.onError(event.error);
          break;

        default:
          console.warn("Unknown event type:", event.type);
      }
    } catch {
      console.warn("Failed to parse event:", line);
    }
  }
}

// Types
export interface Agent {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  agentId: string;
  createdAt: string;
}

export interface OpenAPI {
  id: string;
  name: string;
  schemaUrl: string;
  apiUrl: string;
  toolsSchema: unknown;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MCP {
  id: string;
  name: string;
  transport: "sse" | "http";
  url: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

// Create singleton instance
export const api = new APIClient();
