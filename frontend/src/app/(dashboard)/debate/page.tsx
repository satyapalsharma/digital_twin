"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ArrowRight } from "lucide-react";

export default function DebatePage() {
  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <MessageSquare className="size-10 mx-auto text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Debate Mode lives in Simulations</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Start a new simulation, pick an audience and product, then choose
              <span className="font-medium text-foreground"> Debate</span> as the mode.
              5 personas will debate the product in 3 rounds.
            </p>
          </div>
          <Button asChild>
            <Link href="/simulations">
              Go to simulations
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
