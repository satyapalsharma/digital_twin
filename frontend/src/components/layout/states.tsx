"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

/** Consistent "nothing here yet" panel. Pass an `action` (e.g. a CTA button)
 * to point the user at the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed bg-surface-elevated/30", className)}>
      <CardContent className="py-12 text-center flex flex-col items-center gap-2">
        {Icon && <Icon className="size-8 text-muted-foreground" aria-hidden />}
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}

/** Consistent "couldn't load" panel with an optional retry. Use for failed
 * data fetches so a broken API reads as a handled state, not a blank screen. */
export function ErrorState({
  title = "Couldn’t load this",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed border-destructive/40 bg-destructive/5", className)}>
      <CardContent className="py-12 text-center flex flex-col items-center gap-2">
        <AlertCircle className="size-8 text-destructive" aria-hidden />
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {description ??
            "The server didn’t respond as expected. Check that the API is running, then try again."}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
