# Engineering Workflow & Guidelines

This document defines the engineering workflow for all code changes to utils.live. Every change — features, bug fixes, refactors — follows this process.

## Team & Reporting

| Role     | Model      | Reports To |
| -------- | ---------- | ---------- |
| CTO      | Opus 4.6   | CEO        |
| Engineer | Sonnet 4.6 | CTO        |

## Workflow: Plan → Implement → Review → Deploy

### 1. Plan & Design (CTO)

Before any code is written, the CTO:

- Analyzes the requirement and breaks it into concrete tasks
- Creates an implementation plan with:
  - **Goal**: What we're building and why
  - **Scope**: Files to create/modify, with specific paths
  - **Approach**: Technical design decisions and rationale
  - **Acceptance criteria**: What "done" looks like
  - **Out of scope**: What this change does NOT include
- Posts the plan as a Paperclip issue document (key: `plan`)

### 2. Handoff to Engineer (CTO → Engineer)

The CTO creates a subtask assigned to the Engineer containing:

- Link to the parent task and plan document
- Clear description of what to implement
- Specific files to create or modify
- Acceptance criteria copied from the plan
- Any constraints or warnings (e.g., "do not modify the build config")

**Handoff checklist:**

- [ ] Plan document is complete and reviewed
- [ ] Subtask has clear acceptance criteria
- [ ] All necessary context is in the task description (Engineer should not need to guess)

### 3. Implementation (Engineer)

The Engineer implements the plan:

- Follow existing code conventions in `CLAUDE.md` and `CONTRIBUTING.md`
- Tools are pure functions — no side effects, no network calls, no DOM access in `packages/tools`
- Every new tool must be registered in `register.ts` and exported from its category index
- 100% test coverage is enforced on `packages/tools` — write thorough tests
- Run `pnpm turbo typecheck && pnpm turbo test && pnpm turbo lint` before marking done
- Commit messages should be descriptive: `feat(category): short description` or `fix(category): short description`

**Implementation rules:**

- Stick to the plan. If the plan is unclear or wrong, comment on the task and ask the CTO — do not improvise
- Do not add features beyond what the plan specifies
- Do not refactor surrounding code unless the plan calls for it
- Keep PRs focused — one concern per PR

### 4. Review (CTO)

When the Engineer marks work complete, the CTO reviews:

**Code review checklist:**

- [ ] Implementation matches the plan and acceptance criteria
- [ ] No scope creep — only planned changes are included
- [ ] Code follows project conventions (`CLAUDE.md`)
- [ ] Tools are pure functions with proper Zod schemas
- [ ] New tools are registered in `register.ts` and category index
- [ ] Tests cover happy path, edge cases, all options/modes, and error cases
- [ ] No security issues (XSS, injection, unsafe dependencies)
- [ ] No unnecessary complexity or premature abstractions

**Verification commands:**

```bash
pnpm turbo typecheck        # No type errors
pnpm turbo lint             # No lint errors
pnpm turbo test             # All tests pass
pnpm turbo build            # Build succeeds (static export to apps/web/out/)
```

If issues are found, the CTO either:

- Fixes them directly (minor issues), or
- Sends the task back to the Engineer with specific feedback

### 5. Deploy & Verify (CTO)

After review passes:

1. Merge to `main` (or push directly if working on main)
2. Cloudflare Pages auto-deploys on every push to `main`
3. Verify deployment:
   - Check [Cloudflare Pages dashboard](https://dash.cloudflare.com/) for build success
   - Verify the change is live at https://utils.live/
   - Spot-check affected pages/tools in the browser
4. Mark the task as done with a summary comment

**Do NOT:**

- Add a GitHub Actions deploy workflow (Cloudflare handles deployment)
- Force-push to main
- Merge without all checks passing

## Coding Standards

These supplement the conventions in `CLAUDE.md`:

### General

- TypeScript strict mode — no `any` types unless absolutely necessary
- Pure functions in `packages/tools` — no side effects
- Zod for all validation schemas
- No comments unless the logic isn't self-evident

### Tool Development

- Use `pnpm generate:tool` to scaffold new tools
- Tool IDs: `category/tool-name` (lowercase, hyphens only)
- Always define `inputSchema`, `outputSchema`, `optionsSchema`
- All tools are `client` tier
- 100% test coverage — no exceptions

### Git

- Branch from `main` for feature work
- Commit message format: `type(scope): description`
  - Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`
  - Scope: category name or package name
- Include `Co-Authored-By: Paperclip <noreply@paperclip.ing>` on all commits

### Dependencies

- Use `pnpm` exclusively — never npm or yarn
- Prefer existing dependencies over adding new ones
- Security-audit any new dependency before adding

## Escalation

- **Engineer blocked?** → Comment on the task, CTO will unblock or reassign
- **CTO blocked?** → Escalate to CEO via chain of command
- **Cross-team work?** → Create a task with `billingCode` set, assign to the appropriate team
