# CXO Demo Readiness — UI/UX Architecture Review

**Product:** Simulation Sentinels (synthetic-customer decision twin)
**Reviewer role:** UI/UX Architect
**Date:** 2026-05-30
**Scope:** Full dashboard surface — Personas, Audiences, Products, Surveys, Simulations, Insights, Debate — plus the marketing landing and SSO gate.

---

## 1. Executive summary

The platform already tells a strong story: define a synthetic customer pool → segment an audience → pick a product play → simulate thousands of reactions → read the verdict. The bones are good (clean design system, live simulation progress, rich insights). With Persona authoring/import and the enhanced Product briefing now in place, the **input** side of the funnel is demo-credible.

To be **CXO-demo ready**, the gaps are mostly about *narrative continuity, trust, and the "so what."* An executive audience doesn't grade widgets — they grade whether the tool produces a **defensible decision** and whether the story flows without a stumble. The work below is prioritized against that bar.

**Verdict:** ~70% demo-ready. The five P0 items below are what stand between a good walkthrough and a confident exec pitch.

---

## 2. Demo-day blockers (P0 — do these first)

| # | Gap | Why it kills the demo | Fix |
|---|-----|----------------------|-----|
| P0-1 | **`OPENROUTER_API_KEY` is a placeholder** | Persona generation, simulations, and insights synthesis all silently fail or error mid-demo. This is the single highest risk. | Set a real key in `.env`; pre-run one full simulation so cached results exist as a fallback. Add a visible "LLM connected ✓" health chip. |
| P0-2 | **No "demo reset" / known-good state** | If a previous click left odd data, the demo looks broken. | Add a seed/reset control (or a scripted clean DB snapshot) so every run starts identical. |
| P0-3 | **Empty & error states are inconsistent** | A blank panel or raw error string mid-flow reads as "not finished." Personas empty-state still only shows a CLI command. | Standardize empty/loading/error across pages; the Personas empty state should surface **Add / Import** (now built) instead of a shell command. |
| P0-4 | **The end-to-end "golden path" isn't guided** | Execs need a 3-minute spine: Audience → Product → Simulate → Verdict. Today each page is a separate island. | Add a persistent "Run a decision" CTA / breadcrumb that carries selections forward (the `?product=` link is a start — extend to audience + survey). |
| P0-5 | **"So what?" is under-stated on Insights** | The verdict card exists, but the exec takeaway (ship / hold / redesign + projected $ impact) needs to be the loudest thing on screen. | Lead Insights with a single recommendation banner + 2–3 headline numbers; push charts below the fold. |

---

## 3. High-value enhancements (P1)

- **Decision summary / "boardroom view"** — a one-screen, screenshot-able export (recommendation, confidence, segment winners/losers, top concerns). This is what gets pasted into a steering-committee deck.
- **Audience → Product → Simulation continuity** — pre-fill the simulation form from whatever the user was just looking at; show the chosen audience size and product chip on the run screen so context never resets.
- **Confidence & methodology affordance** — a subtle "How to read this" / "n = 1,240 synthetic respondents, model X" line. Execs trust numbers they can interrogate; synthetic data *especially* needs a credibility cue.
- **Comparison as a first-class story** — the simulation comparison view is a differentiator; surface it as "A/B/C these plays" rather than a hidden mode.
- **Persona authoring polish** (now partially built): add edit/delete of a single persona and de-dup on import; show import provenance in audiences too.
- **Product lifecycle**: clone-a-template-to-customize and edit-custom (today custom products are create/delete only).

## 4. Polish & trust (P2)

- Accessibility pass: focus-visible rings on all interactive cards (persona rows, product cards, import source cards), `aria-label`s on icon-only buttons, color-contrast check on muted text and badges.
- Responsive pass: dashboard tables and the multi-column dialogs (persona form, import preview) need a mobile/tablet review for the "exec on an iPad" scenario.
- Motion: the live simulation progress is a highlight — make sure it's smooth and never janky; consider a subtle "agents thinking" micro-interaction.
- Number formatting consistency (currency, %, large counts) — mostly good; audit charts/tooltips.
- Loading skeletons everywhere a network call gates content (already present on Personas; replicate on Products/Insights).

---

## 5. Per-surface notes

**Marketing landing / SSO** — Good first impression; ensure the SSO dialog can be bypassed/auto-filled for the demo so there's no fumbling with credentials on stage.

**Personas** — Now supports manual add + bulk import (sample / CSV / paste) with source badges. *Remaining:* edit/delete, real column-mapping, large-import progress, empty-state CTA.

**Audiences** — Strong cohort builder with live counts. *Add:* save/name a cohort prominently and show it carried into the simulation run.

**Products** — Now a PM-grade briefing (hypothesis, target, levers, KPIs) and card chips. *Add:* clone-to-customize, edit, and per-scenario config validation.

**Surveys** — Functional builder. *Confirm* a sensible default survey is always present so a demo never starts from zero.

**Simulations** — Live progress + comparison are highlights. *Add:* pre-filled context, and a clear "view results" hand-off to Insights.

**Insights** — Richest surface (verdict, gauges, segment breakdown, diverging personas, telemetry). *Reorder* so the recommendation + headline numbers lead; make it exportable.

**Debate** — Differentiated, memorable. Keep as the "wow" beat near the end of the demo.

---

## 6. Suggested 3-minute demo runbook

1. **Frame (15s):** "Test any product decision on 1,200 synthetic customers before a dollar is spent."
2. **Audience (30s):** open a saved cohort — "high-claim auto holders, 2+ yrs tenure."
3. **Product (30s):** open the enhanced product detail — hypothesis, target, key lever, KPIs.
4. **Simulate (45s):** run it; let the live progress play; land on Insights.
5. **Verdict (45s):** read the recommendation banner + headline numbers; expand one diverging segment.
6. **Wow (15s):** drop into the agent **Debate** for one persona to show the reasoning is real.

---

## 7. Effort / impact snapshot

| Item | Impact | Effort |
|------|--------|--------|
| P0-1 Real API key + cached fallback | 🔴 Critical | XS |
| P0-2 Demo reset / golden state | 🔴 Critical | S |
| P0-3 Empty/error consistency | 🟠 High | S–M |
| P0-4 Golden-path continuity | 🟠 High | M |
| P0-5 Insights "so what" banner | 🟠 High | S |
| P1 Boardroom export | 🟢 Med-High | M |
| P1 Persona edit/delete + dedupe | 🟢 Med | S–M |
| P2 A11y + responsive pass | 🟢 Med | M |

> P0 items are roughly a day of focused work and convert the experience from "promising prototype" to "confident exec demo."
