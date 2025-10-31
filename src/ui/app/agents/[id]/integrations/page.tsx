"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, Link as LinkIcon, Server } from "lucide-react";
import { api, Agent, OpenAPI, MCP } from "@/lib/api";

export default function AgentIntegrationsPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  // OpenAPI state
  const [integrations, setIntegrations] = useState<OpenAPI[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [schemaUrl, setSchemaUrl] = useState("");
  const [apiUrl, setApiUrl] = useState("");

  // MCP state
  const [mcpServers, setMcpServers] = useState<MCP[]>([]);
  const [showCreateMcpDialog, setShowCreateMcpDialog] = useState(false);
  const [creatingMcp, setCreatingMcp] = useState(false);
  const [deletingMcpId, setDeletingMcpId] = useState<string | null>(null);
  const [mcpName, setMcpName] = useState("");
  const [mcpTransport, setMcpTransport] = useState<"sse" | "http">("sse");
  const [mcpUrl, setMcpUrl] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentData, openapis, mcps] = await Promise.all([
          api.getAgent(agentId),
          api.listOpenAPIs(agentId),
          api.getMCPs(agentId),
        ]);

        setAgent(agentData);
        setIntegrations(openapis);
        setMcpServers(mcps);
      } catch {
        toast.error("Failed to load integrations");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, router]);

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.createOpenAPI(agentId, { name, schemaUrl, apiUrl });
      const openapis = await api.listOpenAPIs(agentId);
      setIntegrations(openapis);
      setName("");
      setSchemaUrl("");
      setApiUrl("");
      setShowCreateDialog(false);
      toast.success("Integration created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create integration"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) {
      return;
    }

    setDeletingId(integrationId);

    try {
      await api.deleteOpenAPI(agentId, integrationId);
      setIntegrations(integrations.filter((int) => int.id !== integrationId));
      toast.success("Integration deleted successfully");
    } catch {
      toast.error("Failed to delete integration");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateMcpServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMcp(true);

    try {
      await api.createMCP(agentId, {
        name: mcpName,
        transport: mcpTransport,
        url: mcpUrl,
      });
      const servers = await api.getMCPs(agentId);
      setMcpServers(servers);
      setMcpName("");
      setMcpTransport("sse");
      setMcpUrl("");
      setShowCreateMcpDialog(false);
      toast.success("MCP server created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create MCP server"
      );
    } finally {
      setCreatingMcp(false);
    }
  };

  const handleDeleteMcpServer = async (mcpId: string) => {
    if (!confirm("Are you sure you want to delete this MCP server?")) {
      return;
    }

    setDeletingMcpId(mcpId);

    try {
      await api.deleteMCP(agentId, mcpId);
      setMcpServers(mcpServers.filter((mcp) => mcp.id !== mcpId));
      toast.success("MCP server deleted successfully");
    } catch {
      toast.error("Failed to delete MCP server");
    } finally {
      setDeletingMcpId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Agent not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Integrations</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {integrations.length + mcpServers.length} total
            </p>
          </div>

          <Tabs defaultValue="openapi">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="openapi">OpenAPI</TabsTrigger>
              <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
            </TabsList>

            {/* OpenAPI Tab */}
            <TabsContent value="openapi" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">OpenAPI Integrations</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect REST APIs using OpenAPI specs
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {integrations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                    <LinkIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No integrations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect external APIs to extend capabilities
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Integration
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {integrations.map((integration) => (
                    <Card key={integration.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <LinkIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold text-sm truncate">
                              {integration.name}
                            </h4>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                API:{" "}
                              </span>
                              <span className="font-mono">
                                {integration.apiUrl}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Schema:{" "}
                              </span>
                              <span className="font-mono">
                                {integration.schemaUrl}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteIntegration(integration.id)
                          }
                          disabled={deletingId === integration.id}
                          className="shrink-0 h-8 w-8 p-0"
                        >
                          {deletingId === integration.id ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* MCP Tab */}
            <TabsContent value="mcp" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">MCP Servers</h3>
                  <p className="text-xs text-muted-foreground">
                    Model Context Protocol servers
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateMcpDialog(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {mcpServers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Server className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No MCP servers</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add servers to extend with specialized tools
                  </p>
                  <Button
                    onClick={() => setShowCreateMcpDialog(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Server
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {mcpServers.map((mcp) => (
                    <Card key={mcp.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Server className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold text-sm truncate">
                              {mcp.name}
                            </h4>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {mcp.transport}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">URL: </span>
                            <span className="font-mono">{mcp.url}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMcpServer(mcp.id)}
                          disabled={deletingMcpId === mcp.id}
                          className="shrink-0 h-8 w-8 p-0"
                        >
                          {deletingMcpId === mcp.id ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* OpenAPI Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add OpenAPI Integration</DialogTitle>
            <DialogDescription>
              Connect a REST API using OpenAPI specification
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateIntegration} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Weather API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={creating}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiUrl">API Base URL *</Label>
              <Input
                id="apiUrl"
                placeholder="https://api.example.com"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemaUrl">OpenAPI Schema URL *</Label>
              <Input
                id="schemaUrl"
                placeholder="https://api.example.com/openapi.json"
                value={schemaUrl}
                onChange={(e) => setSchemaUrl(e.target.value)}
                required
                disabled={creating}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="flex-1 gap-2"
              >
                {creating ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MCP Dialog */}
      <Dialog open={showCreateMcpDialog} onOpenChange={setShowCreateMcpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Configure a Model Context Protocol server
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMcpServer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mcpName">Server Name *</Label>
              <Input
                id="mcpName"
                placeholder="e.g., Math Tools"
                value={mcpName}
                onChange={(e) => setMcpName(e.target.value)}
                required
                disabled={creatingMcp}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport">Transport Type *</Label>
              <Select
                value={mcpTransport}
                onValueChange={(value) =>
                  setMcpTransport(value as "sse" | "http")
                }
                disabled={creatingMcp}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                  <SelectItem value="http">HTTP (Streamable HTTP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mcpUrl">Server URL *</Label>
              <Input
                id="mcpUrl"
                placeholder="http://localhost:8000/mcp"
                value={mcpUrl}
                onChange={(e) => setMcpUrl(e.target.value)}
                required
                disabled={creatingMcp}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateMcpDialog(false)}
                disabled={creatingMcp}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingMcp}
                className="flex-1 gap-2"
              >
                {creatingMcp ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
