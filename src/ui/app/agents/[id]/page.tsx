"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Send,
  Wrench,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Bot,
} from "lucide-react";
import { api, Agent } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: Date;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
}

export default function AgentChatPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const agentData = await api.getAgent(agentId);
        setAgent(agentData);
      } catch {
        toast.error("Failed to load agent");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      await api.chatStream(
        agentId,
        userMessage,
        (tool, args, id) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `tool_${id}`,
              role: "tool",
              content: "",
              timestamp: new Date(),
              toolName: tool,
              toolArgs: args,
            },
          ]);
        },
        (tool, content) => {
          setMessages((prev) => {
            const lastToolIndex = prev.findLastIndex(
              (msg) => msg.role === "tool" && msg.toolName === tool
            );
            if (lastToolIndex !== -1) {
              const updated = [...prev];
              updated[lastToolIndex] = {
                ...updated[lastToolIndex],
                toolResult: content,
              };
              return updated;
            }
            return prev;
          });
        },
        (token) => {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + token },
              ];
            } else {
              return [
                ...prev,
                {
                  id: `assistant_${Date.now()}`,
                  role: "assistant",
                  content: token,
                  timestamp: new Date(),
                },
              ];
            }
          });
        },
        () => {
          setSending(false);
        },
        (error) => {
          toast.error(error);
          setSending(false);
        }
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message"
      );
      setSending(false);
    }
  };

  const toggleToolExpanded = (messageId: string) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
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
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Start a conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  {agent.description || "Ask me anything"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => {
              if (message.role === "tool") {
                const isExpanded = expandedTools.has(message.id);
                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[80%] bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {message.toolName}
                          </span>
                          {message.toolResult ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <Spinner className="w-3 h-3" />
                          )}
                        </div>
                        <button
                          onClick={() => toggleToolExpanded(message.id)}
                          className="p-0.5 hover:bg-background rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {isExpanded && (
                        <>
                          {message.toolArgs && (
                            <div className="mt-2">
                              <p className="text-xs font-medium mb-1">
                                Arguments:
                              </p>
                              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                                {JSON.stringify(message.toolArgs, null, 2)}
                              </pre>
                            </div>
                          )}
                          {message.toolResult && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium mb-1">
                                Result:
                              </p>
                              <p className="text-xs">{message.toolResult}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-card text-card-foreground border"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-card">
        <form
          onSubmit={handleSendMessage}
          className="flex gap-2 max-w-4xl mx-auto"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            autoFocus
          />
          <Button type="submit" disabled={sending || !input.trim()} size="icon">
            {sending ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
