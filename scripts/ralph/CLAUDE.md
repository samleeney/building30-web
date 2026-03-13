# Ralph Agent Instructions

You are an autonomous coding agent building the Building30 frontend — a React SPA for the GTD system.

## Project Context

- **This repo**: `~/personal_projects/building30-web` — React + TypeScript + Vite
- **Server**: Running at `http://localhost:8080` (or `https://api.building30.io` in prod)
- **Rebuild plan**: `~/personal_projects/mission-control/REBUILD_PLAN.md`
- **Account credentials**: `~/personal_projects/mission-control/.accounts`

## Auth0 Config (from .accounts)

- Domain: `dev-gwbgo2ww358tjjby.eu.auth0.com`
- SPA Client ID: `RjNnnoVDET5U1IIUUnVbi5i9A4xK1Man`
- Audience: `https://api.building30.io`
- Callback URLs: `https://building30.io/callback, http://localhost:5173/callback`
- Logout URLs: `https://building30.io, http://localhost:5173`
- Web Origins: `https://building30.io, http://localhost:5173`

## Your Task

1. Read the PRD at `scripts/ralph/prd.json`
2. Read the progress log at `scripts/ralph/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, create it from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks: `npm run build` (must succeed), `npx tsc --noEmit` (typecheck)
7. Update CLAUDE.md files if you discover reusable patterns
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `scripts/ralph/progress.txt`

## Design System (C3 aesthetic)

- Geist Sans/Mono fonts
- Zero border radius: `* { border-radius: 0 }`
- oklch monochrome palette
- Grid-line background
- Minimal, high-density layout
- Use shadcn/ui components where available

## Progress Report Format

APPEND to `scripts/ralph/progress.txt`:
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

## Consolidate Patterns

If you discover a reusable pattern, add it to `## Codebase Patterns` at the TOP of progress.txt.

## Quality Requirements

- ALL commits must pass: `npm run build`
- TypeScript strict mode — no `any` types unless absolutely necessary
- Follow existing patterns in the codebase
- Use shadcn/ui components from `src/components/ui/`

## Stop Condition

After completing a story, check if ALL stories have `passes: true`.
If ALL complete, reply with: <promise>COMPLETE</promise>
Otherwise, end normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Read Codebase Patterns in progress.txt before starting
