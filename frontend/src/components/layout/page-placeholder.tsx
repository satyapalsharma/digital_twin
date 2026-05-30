"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

interface Props {
  title: string;
  description: string;
  next: string;
}

export function PagePlaceholder({ title, description, next }: Props) {
  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
      </div>
      <Card className="border-dashed bg-surface-elevated/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Construction className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">Up next</CardTitle>
              <CardDescription>Implementation hand-off</CardDescription>
            </div>
            <Badge variant="muted" className="ml-auto">
              placeholder
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">{next}</p>
        </CardContent>
      </Card>
    </div>
  );
}
