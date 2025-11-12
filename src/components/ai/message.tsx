import * as React from "react";
import { Brain, Shield, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type MessageRole = "assistant" | "user" | "system";

const ROLE_META: Record<
  MessageRole,
  {
    wrapper: string;
    iconClass: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }
> = {
  assistant: {
    wrapper: "flex-row text-left",
    iconClass:
      "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
    icon: Brain,
  },
  user: {
    wrapper: "flex-row-reverse text-right",
    iconClass:
      "bg-slate-900/5 text-slate-600 ring-1 ring-inset ring-slate-200",
    icon: UserRound,
  },
  system: {
    wrapper: "flex-row text-left opacity-80",
    iconClass:
      "bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-500/40",
    icon: Shield,
  },
};

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from?: MessageRole;
}

export function Message({ from = "assistant", className, children, ...props }: MessageProps) {
  const meta = ROLE_META[from] ?? ROLE_META.assistant;
  const Icon = meta.icon;

  return (
    <div
      className={cn("flex w-full gap-3", meta.wrapper, className)}
      {...props}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm",
          meta.iconClass
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1 space-y-2">{children}</div>
    </div>
  );
}

export const MessageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props} />
  )
);

MessageContent.displayName = "MessageContent";
