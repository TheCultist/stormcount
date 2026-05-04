# Claude Agent Instructions

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **General fixes, not one-offs**: Prefer changes that fix a **class** of inputs (shared helper, right layer, structural coordination). Avoid hyper-specific guards tuned to a single bug report string unless that string represents a **named, general** pattern. See `.cursor/rules/general-fixes-not-one-offs.mdc`.

---

## Search Pipeline Architecture

The search pipeline has five phases plus an intent resolver. **Read the full rules in `.cursor/rules/search-pipeline-architecture.mdc` before touching any pipeline file.**

### The golden rule: Phase 1 is FROZEN

`lib/search-pipeline/phase1/` and all its sub-modules (`constants.ts`, `resolveStats.ts`, `resolveRarity.ts`, `isFlags.ts`, `landCycles.ts`, `actionRules.ts`) are frozen. **Do not add new regex patterns, token lists, or detection logic to any of these files.**

| If you need to handle a new… | Put it in… |
|---|---|
| Colloquial stat/rarity/year phrase | `phase1_5/structuredExtraction.ts` (extend the AI prompt or trigger list) |
| Abstract vibe/strategy/theme | `phase2/resolveUnresolvedFragments.ts` (extend the resolver prompt) |
| 100% deterministic grammar-stable pattern | A `phase1/` sub-module — but only after confirming it cannot be misinterpreted |
| New named-card intent type | `resolveIntentClauses.ts` + add detection in `parseNaturalQuery.ts` + add `QueryIntent` to `types.ts` |

### Phase routing cheat-sheet

- **"super expensive"**, **"dirt cheap rares"**, **"big creatures"**, **"printed before 2015"** → Phase 1.5 (structured AI extraction with narrow JSON schema)
- **"stax pieces"**, **"recursion engines"**, **"something that combos with X"** → Phase 2 (abstract resolver)
- **`name:"X" game:paper`** or any raw Scryfall syntax → `direct-scryfall` intent, passes through all phases unchanged
- **"cards similar to [card name]"** / **"art like [card name]"** / **"synergy with [card name]"** → intent resolver (`resolveIntentClauses.ts`) then continues to Phase 1.5/2/3

### The intent resolver is NOT a bypass

`resolveIntentClauses.ts` runs between Phase 1 and Phase 1.5. It fetches Tagger or LLM data for a specific named card and injects the result as a `mustClause` (source: `"phase1:intent"`). The query then continues through every remaining phase — the intent resolver is a pipeline step, not an exit.

### Never break the IR contract

All phases communicate via `SearchPipelineIR` defined in `lib/search-pipeline/types.ts`. Clauses go into `mustClauses` or `shouldClauses`. Anything unresolved goes into `unresolvedFragments` so a later phase can handle it. Never short-circuit by writing a raw Scryfall string mid-pipeline unless you are in Phase 3 finalization.

DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:
 
Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
 
Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
 
Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
 
Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.
 
Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
 
Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""