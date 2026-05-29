"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Save, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionEditor, type Question } from "./question-editor";
import { api } from "@/lib/api";

const STARTER_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "likert",
    prompt: "On a scale of 1-5, how likely are you to take up this offer?",
    scale_min: 1,
    scale_max: 5,
  },
  {
    id: "q2",
    type: "multi_choice",
    prompt: "What is your overall sentiment about this offer?",
    options: ["positive", "neutral", "negative"],
  },
];

function uid() {
  return `q${Math.random().toString(36).slice(2, 8)}`;
}

export function SurveyBuilder() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>(STARTER_QUESTIONS);
  const [saving, setSaving] = useState(false);

  function updateQ(i: number, q: Question) {
    setQuestions((qs) => qs.map((x, idx) => (idx === i ? q : x)));
  }

  function deleteQ(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  function addQ() {
    setQuestions((qs) => [
      ...qs,
      { id: uid(), type: "open_text", prompt: "" },
    ]);
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Name your survey first");
    const cleanQs = questions
      .map((q) => ({ ...q, prompt: q.prompt.trim() }))
      .filter((q) => q.prompt.length > 0);
    if (cleanQs.length === 0) return toast.error("Add at least one question");

    setSaving(true);
    try {
      await api.post("/surveys", {
        name: name.trim(),
        description: description.trim(),
        questions: cleanQs,
      });
      toast.success("Survey saved");
      router.push("/surveys");
    } catch (e) {
      toast.error(`Save failed: ${String(e).slice(0, 120)}`);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey details</CardTitle>
          <CardDescription>
            These questions will replace the default 5-question survey when you
            select this survey on a simulation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder='Survey name (e.g. "Pricing sensitivity v2")'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Questions <span className="text-muted-foreground font-normal">({questions.length})</span>
          </h2>
          <Button variant="outline" size="sm" onClick={addQ}>
            <Plus className="size-3.5" />
            Add question
          </Button>
        </div>

        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            onChange={(qq) => updateQ(i, qq)}
            onDelete={() => deleteQ(i)}
          />
        ))}

        {questions.length === 0 && (
          <Card className="border-dashed bg-surface-elevated/30">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No questions yet. Click <span className="font-medium">Add question</span> above.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !name.trim()} size="lg">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : "Save survey"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/surveys")} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
