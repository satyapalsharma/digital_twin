"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurveyBuilder } from "@/components/surveys/survey-builder";

export default function NewSurveyPage() {
  return (
    <div className="px-8 py-10 max-w-3xl mx-auto space-y-6">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/surveys">
            <ArrowLeft className="size-4" />
            All surveys
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New survey</h1>
          <p className="text-muted-foreground mt-1">
            Mix Likert scales, multiple choice, and open-text questions.
          </p>
        </div>
      </div>
      <SurveyBuilder />
    </div>
  );
}
