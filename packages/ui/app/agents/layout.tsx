"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bot, LogOut, ChevronDown } from "lucide-react";
import { api, Agent } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { removeToken } from "@/lib/auth";

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Check if we're on an agent detail page
  const agentId = params.id as string | undefined;

  useEffect(() => {
    const fetchAgents = async () => {
      if (!agentId) return;

      const [agentData, agentsList] = await Promise.all([
        api.getAgent(agentId),
        api.listAgents(),
      ]);

      setAgent(agentData);
      setAgents(agentsList);
    };

    fetchAgents();
  }, [agentId, router]);

  const handleLogout = () => {
    removeToken();
    router.push("/signin");
  };

  const handleAgentChange = (newAgentId: string) => {
    if (pathname.includes("/documents")) {
      router.push(`/agents/${newAgentId}/documents`);
    } else if (pathname.includes("/integrations")) {
      router.push(`/agents/${newAgentId}/integrations`);
    } else if (pathname.includes("/settings")) {
      router.push(`/agents/${newAgentId}/settings`);
    } else {
      router.push(`/agents/${newAgentId}`);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <Bot className="h-8 w-8 text-primary" />
          {agentId && agent ? (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => router.push("/agents")}
                  >
                    Agents
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
                      {agent.name}
                      <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {agents.map((a) => (
                        <DropdownMenuItem
                          key={a.id}
                          onClick={() => handleAgentChange(a.id)}
                          className={a.id === agentId ? "bg-muted" : ""}
                        >
                          {a.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
