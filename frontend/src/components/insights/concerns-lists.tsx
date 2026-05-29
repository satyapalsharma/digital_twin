"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  concerns: string[];
  positives: string[];
}

export function ConcernsLists({ concerns, positives }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <List
        title="Top concerns"
        items={concerns}
        icon={<TrendingDown className="size-4 text-destructive" />}
        bullet="bg-destructive/30"
        emptyLabel="No notable concerns surfaced"
      />
      <List
        title="Top positives"
        items={positives}
        icon={<TrendingUp className="size-4 text-success" />}
        bullet="bg-success/30"
        emptyLabel="No positives surfaced"
      />
    </div>
  );
}

interface ListProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  bullet: string;
  emptyLabel: string;
}

function List({ title, items, icon, bullet, emptyLabel }: ListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((it, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className={`size-1.5 rounded-full mt-1.5 shrink-0 ${bullet}`} />
                <span className="leading-relaxed">{it}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
