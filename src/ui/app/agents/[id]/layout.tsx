"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import {
  MessageSquare,
  FileText,
  Link as LinkIcon,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
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
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r bg-card">
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  item.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-background">{children}</div>
    </div>
  );
}
