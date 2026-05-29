"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { Bookmark } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface AudienceRow {
  id: number;
  name: string;
  description: string;
  persona_ids: number[];
  created_at: string;
}

export function SavedAudiences({ refreshKey }: { refreshKey: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["audiences", refreshKey],
    queryFn: () => api.get<AudienceRow[]>("/audiences"),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[88px]" />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed bg-surface-elevated/30">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No saved audiences yet — tune filters above and hit Save.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((a) => (
        <Card key={a.id} className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Bookmark className="size-4 text-primary shrink-0" />
                <h4 className="font-medium truncate">{a.name}</h4>
              </div>
              <Badge variant="muted" className="shrink-0">
                {formatNumber(a.persona_ids.length)}
              </Badge>
            </div>
            {a.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {a.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
