# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Running a single test

- `bun test test/models.test.ts` — one file
- `bun test -t "ambiguous"` — filter by test name (regex)

Bun runs `.ts` directly. Nothing is compiled or bundled (`tsconfig` sets `noEmit`); there is no `dist/`.

## What actually ships

The plugin's runtime behaviour lives in the markdown files below plus the bundled MCP server:

| Surface   | File                                                                                          | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill     | `skills/delegate/SKILL.md`                                                                    | Model picking, brief template, review-after-return rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Agent     | `agents/opencode-worker.md`                                                                   | Supervisor (`model: haiku`, `background: true`, no edit tools: Read/Grep/Glob/Bash/ToolSearch plus MCP `delegate`/`list_models`/`list_sessions`): the only caller of MCP `delegate`; never writes the solution itself; verifies git changes and tests, iterates at most twice, then rejects                                                                                                                                                                                                                                                                                                   |
| Command   | `commands/opencode.md`                                                                        | `/opencode <model> -- <task>`: splits on `--`, spawns `opencode-worker`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Hook      | `scripts/route-to-opencode.sh`, `scripts/guard-main-thread-mcp.sh`, `plugin-hooks/hooks.json` | PreToolUse `Agent\|Task`: rewrites only built-in subagent calls (general-purpose, claude, Explore, Plan, claude-code-guide, statusline-setup) to `claudelegate:opencode-worker` on Haiku (Explore/Plan/claude-code-guide forced read-only); custom, plugin, reviewer and SDD agents never routed; pass-through guards: `OPENCODE_DELEGATE_ROUTE=off`, missing opencode, `[no-opencode]`, no `jq`. Second PreToolUse entry (`guard-main-thread-mcp.sh`) denies this plugin's MCP `delegate`/`delegate_async` when the input has no `agent_id` (main thread); calls from `opencode-worker` pass |
| MCP       | `plugin.json` `mcpServers`, `src/index.ts`, `dist/index.js`                                   | `opencode` MCP server (stdio, `bun ${CLAUDE_PLUGIN_ROOT}/dist/index.js`) exposing `delegate`, `delegate_async`, `task_result`, `task_list`, `task_cancel`, `list_models`, `list_sessions` to the worker (the main thread never calls them); its `instructions` (always in the system prompt) make spawning the background worker the default for implementation                                                                                                                                                                                                                               |
| Manifests | `.claude-plugin/plugin.json`, `marketplace.json`                                              | Plugin identity; `plugin.json` carries homepage/repository shown by Claude Code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

`src/` backs the MCP server (`src/index.ts`). The installed plugin cache has no `node_modules`, so what runs is the committed bundle `dist/index.js`: changing `src/` changes plugin behaviour only after `bun run build`, and CI fails if `dist/` is stale. Its exports (`delegate`, `resolveModel`, `buildArgs`, `EventCollector`) are also the reference for how `opencode run` must be invoked and how its JSON stream is parsed; `opencode-worker` calls the MCP `delegate` tool, which uses them.

- `plugin-hooks/` holds the plugin's Claude Code hooks (registered via the `hooks` field in `plugin.json`); `hooks/` holds this repo's git hooks. Never put `hooks.json` in `hooks/`. The routing script is tested by `test/route-hook.test.ts`.

Invocation gotchas (observed on opencode 2.1.2):

- The command needs `</dev/null`. When stdin is an open pipe (as in Claude's Bash tool), `opencode run` waits for it to close and never creates a session.
- Write tasks must pass `--agent build`, because `default_agent` is `plan` both in this repo's `opencode.json` and in typical user configs.
- Without `--auto`, a headless run auto-rejects permission requests and continues; this is what makes `--agent plan` safe for read-only work.
- If no model is named, omit `-m` so opencode's configured default model is used.
- Sub-agents are denied via `OPENCODE_CONFIG_CONTENT` (permission action `subagent`, opencode 2.1.3); that env only applies with `--standalone`, since the background `opencode serve --service` ignores client env.

Call chain inside `src/`: `delegate.ts` → `models.resolveModelOrThrow` (`listModels` → `opencode models`, cached 5 min) → `opencode.runOpencode` (spawns the process, folds stdout through `EventCollector`) → git-diff changed-files detection → `formatOutcome`.

## Model resolution rules (`src/models.ts`)

- An exact `provider/model` id wins first; `#variant` is split off and re-appended.
- Every token containing a digit must appear in the model name, so `grok 4.7` never matches 4.6.
- Ties prefer the candidate with fewer unrequested name tokens; a query without a version token is ambiguous whenever candidates tie.
- The same model from several providers goes to `OPENCODE_DELEGATE_PREFERRED_PROVIDERS` order first, then a direct provider over an `AGGREGATORS` reseller.

## Keeping docs and manifests in sync

- Defaults and env vars are defined in `src/config.ts` and documented in the README env table and the skill — update all three together.
- release-please bumps the version in `package.json`, `plugin.json` and `marketplace.json`; never edit versions by hand.
