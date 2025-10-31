"use client";

import { useRouter, useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  FileText,
  Link as LinkIcon,
  Settings,
  Bot,
  LogOut,
  User,
} from "lucide-react";
import { Agent } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SidebarProps {
  agent: Agent;
  agents: Agent[];
  onAgentChange: (agentId: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  agent,
  agents,
  onAgentChange,
  onLogout,
}: SidebarProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const agentId = params.id as string;

  const navigation = [
    {
      name: "Chat",
      href: `/agents/${agentId}`,
      icon: MessageSquare,
      current: pathname === `/agents/${agentId}`,
    },
    {
      name: "Documents",
      href: `/agents/${agentId}/documents`,
      icon: FileText,
      current: pathname === `/agents/${agentId}/documents`,
    },
    {
      name: "Integrations",
      href: `/agents/${agentId}/integrations`,
      icon: LinkIcon,
      current: pathname === `/agents/${agentId}/integrations`,
    },
    {
      name: "Settings",
      href: `/agents/${agentId}/settings`,
      icon: Settings,
      current: pathname === `/agents/${agentId}/settings`,
    },
  ];

  return (
    <div className="flex h-screen w-72 flex-col border-r bg-card shadow-lg">
      {/* Logo */}
      <div className="flex h-20 items-center border-b px-6 bg-background/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">Agents</span>
            <p className="text-xs text-muted-foreground">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Agent Selector */}
      <div className="p-4 border-b bg-background/30">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
          Current Agent
        </Label>
        <Select value={agentId} onValueChange={onAgentChange}>
          <SelectTrigger className="w-full h-12 border-2">
            <SelectValue>
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-semibold text-sm truncate">
                    {agent.name}
                  </span>
                  {agent.description && (
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {agent.description}
                    </span>
                  )}
                </div>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id} className="cursor-pointer">
                <div className="flex flex-col items-start py-1">
                  <span className="font-medium">{a.name}</span>
                  {a.description && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {a.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
          Navigation
        </Label>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                item.current
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:scale-102"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4 bg-background/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Account</p>
            <p className="text-xs text-muted-foreground truncate">
              Authenticated
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-lg"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
