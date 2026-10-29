# Claudelegate

[![CI](https://github.com/lehcode/claudelegate/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/lehcode/claudelegate/actions/workflows/ci.yml) [![CodeQL](https://github.com/lehcode/claudelegate/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/lehcode/claudelegate/actions/workflows/codeql.yml) [![Release](https://github.com/lehcode/claudelegate/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/lehcode/claudelegate/actions/workflows/release.yml) [![npm](https://img.shields.io/npm/v/@lehcode/claudelegate)](https://www.npmjs.com/package/@lehcode/claudelegate) [![GitHub release](https://img.shields.io/github/v/release/lehcode/claudelegate)](https://github.com/lehcode/claudelegate/releases) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Claude Code plugin that hands scoped coding work to any model in your OpenCode install, whether it runs locally (Ollama, llama.cpp), behind a proxy such as LiteLLM, or at a hosted provider. Claude plans and reviews while a cheaper model writes the code.

```text
you    ▸ /opencode qwen 3.6 -- add input validation to the signup form
claude ▸ spawns opencode-worker (model: qwen 3.6, mode: write)
worker ▸ MCP delegate → litellm/qwen3.6-main, session ses_abc, 3 files changed, report
claude ▸ reads git diff, runs tests, reports which model did what and a verdict
```

## Install

```text
/plugin marketplace add lehcode/claudelegate
/plugin install claudelegate@lehcode
```

To use a local clone, add it as a directory marketplace: `/plugin marketplace add /path/to/clone`. After pulling changes, refresh the plugin (`/plugin` → update, or reinstall).

### Requirements

Claudelegate works in Claude Code only. Its hooks, agent and local MCP server don't load on claude.ai or in Cowork.

- OpenCode v2 or later with at least one provider configured (verified on 2.1.3)
- Bun 1.1 or later, which runs the MCP server
- `jq` on PATH
- `git`

## Example setup

Claudelegate can use any model that `opencode models` lists. The two setups below come from a working install, with hostnames, keys and paths replaced. Both run a Qwen3.6 model on a llama.cpp `llama-server` on another machine (`gpu-host`), plus a local Ollama and OpenCode Zen's free models. OpenCode finds Ollama on `127.0.0.1:11434` by itself, and the Zen free models need no login, so neither needs a config entry.

### Without a proxy

OpenCode talks to `llama-server` directly through an OpenAI-compatible provider. List every model the server exposes under `models`.

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "plan",
  "model": "llamacpp/qwen3.6",
  "providers": {
    "llamacpp": {
      "package": "aisdk:@ai-sdk/openai-compatible",
      "name": "llama.cpp on gpu-host",
      "settings": { "baseURL": "http://gpu-host:8080/v1" },
      "models": {
        "qwen3.6": { "name": "Qwen3.6", "limit": { "context": 114688, "output": 16384 } },
      },
    },
  },
}
```

If `llama-server` runs with `--api-key`, add `"apiKey": "{env:LLAMA_API_KEY}"` to `settings`.

```console
$ opencode models
llamacpp/qwen3.6
ollama/llama3.1:8b
ollama/mistral-nemo:12b
ollama/qwen3.5:9b
ollama/qwen3.5:latest
opencode/big-pickle
opencode/deepseek-v4.1-flash-free
opencode/glm-5.3-flash-free
```

### With a LiteLLM proxy

LiteLLM runs next to OpenCode on port 4000 and forwards to `llama-server`. OpenCode gets one provider for everything behind the proxy, and the model ids are LiteLLM's `model_name` aliases.

```yaml
# LiteLLM config.yaml
model_list:
  - model_name: qwen3.6-main
    litellm_params:
      model: openai/qwen3.6
      api_base: http://gpu-host:8080/v1
      api_key: none
```

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "plan",
  "model": "litellm/qwen3.6-main",
  "providers": {
    "litellm": {
      "package": "aisdk:@ai-sdk/openai-compatible",
      "name": "LiteLLM",
      "settings": {
        "baseURL": "http://127.0.0.1:4000/v1",
        "apiKey": "{env:LITELLM_API_KEY}",
      },
      "models": {
        "qwen3.6-main": {
          "name": "Qwen3.6 via LiteLLM",
          "limit": { "context": 114688, "output": 16384 },
        },
      },
    },
  },
}
```

`opencode models` then lists `litellm/qwen3.6-main` instead of `llamacpp/qwen3.6`. The Ollama and Zen models are the same.

| Concern                  | Without a proxy                      | With LiteLLM                                                |
| ------------------------ | ------------------------------------ | ----------------------------------------------------------- |
| OpenCode providers       | One per server                       | One for everything behind the proxy                         |
| Model ids                | `llamacpp/qwen3.6`                   | `litellm/qwen3.6-main`                                      |
| Adding or moving a model | Edit `opencode.jsonc`                | Edit LiteLLM's `model_list`, then add the alias to `models` |
| Keys                     | One per provider in `opencode.jsonc` | One LiteLLM key; upstream keys stay in LiteLLM              |
| Extras                   | None                                 | LiteLLM's routing, fallbacks and spend logs                 |

### Model names in this setup

| You say               | Claudelegate runs                                                                |
| --------------------- | -------------------------------------------------------------------------------- |
| nothing               | `-m` is omitted, so OpenCode uses `model` from `opencode.jsonc`                  |
| `qwen 3.6`            | `litellm/qwen3.6-main` (or `llamacpp/qwen3.6` without the proxy)                 |
| `qwen 3.5`            | Ambiguous: `ollama/qwen3.5:9b` and `ollama/qwen3.5:latest`; the worker picks one |
| `qwen 3.5 9b`         | `ollama/qwen3.5:9b`                                                              |
| `deepseek v4.1 flash` | `opencode/deepseek-v4.1-flash-free`                                              |
| `glm 5.3`             | `opencode/glm-5.3-flash-free`                                                    |

### Permissions in delegated runs

Delegated runs use your OpenCode permission rules. This excerpt asks by default and allows reads:

```jsonc
"permissions": [
  { "action": "*", "resource": "*", "effect": "ask" },
  { "action": "read", "resource": "*", "effect": "allow" },
  { "action": "read", "resource": "/**/.env.*", "effect": "deny" },
  { "action": "shell", "resource": "git status *", "effect": "allow" },
  { "action": "shell", "resource": "ssh *", "effect": "ask" },
  { "action": "subagent", "resource": "*", "effect": "allow" }
]
```

| Rule effect            | Read-only (`--agent plan`)           | Write (`--agent build --auto`) |
| ---------------------- | ------------------------------------ | ------------------------------ |
| `allow`                | Runs                                 | Runs                           |
| `ask`                  | Rejected                             | Approved                       |
| `deny`                 | Refused                              | Refused                        |
| `subagent`, any effect | Refused; Claudelegate appends a deny | Refused                        |

`--auto` approves every `ask` rule, so in write mode `ssh *` above would run. Use `deny` for anything a delegated run must never do. `default_agent: plan` doesn't block writes, because write mode passes `--agent build`.

## Usage

Say "Use qwen 3.6 via opencode to add tests for `src/date.ts`." Or use the slash command: `/opencode <model> -- <task>`. For example: `/opencode deepseek v4.1 flash -- write unit tests for src/date.ts`. You can also spawn the `claudelegate:opencode-worker` agent from a workflow with the model and task in its prompt. Claude does this on its own for ordinary implementation work.

## How it works

```mermaid
flowchart LR
    C[Claude] -->|model + task + mode| W[opencode-worker]
    W -->|brief| M["MCP delegate"]
    M -->|opencode run, JSON events| W
    W -->|"verifies git changes + tests, iterates ≤2, report <200 words"| C
    C -->|reviews diff, runs tests| C
    C -.->|feedback + session id, new worker| W
```

The main thread spawns the background `opencode-worker` (Haiku, no edit tools). The worker resolves model and mode (read-only tasks pass `auto: false`), writes a self-contained brief, calls the MCP `delegate` tool, checks the git diff and runs tests or build, retries at most twice with the same session, otherwise reports reject. Its report has model, session id, changed files, verification and verdict, under 200 words. A timed-out run isn't retried; the worker reports the session id so you can continue.

The main thread never calls `delegate` itself: a hook denies it. For each `delegate` call, the MCP server runs:

```bash
opencode run --format json --standalone --agent build --auto [-m provider/model[#variant]] [--session <id>] --title "<title>" -- "<prompt>" </dev/null
```

The run uses your existing OpenCode auth, config, agents and permission rules. The server also sets `OPENCODE_CONFIG_CONTENT` to deny OpenCode's `subagent` permission, so the model does the work in its own session. `--standalone` is needed because the background OpenCode service ignores the client's environment.

## Automatic routing

Built-in subagents (`general-purpose`, `claude`, `Explore`, `Plan`, `claude-code-guide`, `statusline-setup`) are rewritten to `claudelegate:opencode-worker` on Haiku. `Explore`, `Plan` and `claude-code-guide` become read-only. Custom, project, user, plugin, reviewer and SDD agents stay on Claude.

To opt out, set `OPENCODE_DELEGATE_ROUTE` to `0`, `false`, `no` or `off` (this also disables the main-thread guard), or put `[no-opencode]` in a single prompt. Routing is also skipped when `opencode` or `jq` can't be found.

A hook denies `delegate` and `delegate_async` calls from the main thread. Calls from inside a subagent pass because Claude Code sends `agent_id` only there. The MCP server sends `instructions` that make delegation the default.

## Modes and Models

| Mode            | When                                      | OpenCode flags               |
| --------------- | ----------------------------------------- | ---------------------------- |
| write (default) | Code, fix, refactor                       | `--agent build --auto`       |
| read-only       | Review, question, summary, second opinion | `--agent plan` (no `--auto`) |

| Input                    | Behaviour                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| none                     | `-m` omitted; OpenCode uses its configured default model                                       |
| exact `provider/model`   | Used as is                                                                                     |
| loose name (`qwen 3.6`)  | Resolved against `opencode models`; a named version must match exactly (3.6 never becomes 3.5) |
| ambiguous loose name     | `delegate` returns the candidates and the worker picks the one that fits the task best         |
| `provider/model#variant` | Variant preserved, for example `litellm/qwen3.6-main#high`                                     |

The plugin has no built-in default models. Write mode passes `--agent build` because `default_agent` is often `plan`, and `--auto`, so OpenCode approves its own permission requests and edits files and runs commands without asking. Without `--auto` headless runs reject permission requests automatically, which makes `plan` safe. The `</dev/null` redirect is required: with an open stdin pipe, `opencode run` waits forever.

## Continuing and parallel work

Continue by spawning `claudelegate:opencode-worker` again with the session id and precise feedback. The run is killed after `OPENCODE_DELEGATE_TIMEOUT` seconds (1800 by default). Parallel writers share the working directory, so use separate git worktrees (`git worktree add`) or non-overlapping files. To compare models, give the same task to each in its own worktree and diff the results.

## Configuration

| Variable                                | Default     | Description                                                                                                                                          |
| :-------------------------------------- | :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCODE_BIN`                          | `opencode`  | Path to the opencode executable; when unset, the MCP server searches `PATH` and common install dirs and the routing hook uses `opencode` from `PATH` |
| `OPENCODE_DELEGATE_ROUTE`               | on          | `0`, `false`, `no` or `off` disables automatic routing and the main-thread guard                                                                     |
| `OPENCODE_DELEGATE_DEFAULT_MODEL`       | unset       | Model when none is given; unset or empty means OpenCode's configured default                                                                         |
| `OPENCODE_DELEGATE_AUTO`                | `true`      | Default for `auto`; `0`, `false`, `no`, `off` disable it                                                                                             |
| `OPENCODE_DELEGATE_TIMEOUT`             | `1800`      | Seconds before a run is killed                                                                                                                       |
| `OPENCODE_DELEGATE_MAX_OUTPUT`          | `40000`     | Response character limit                                                                                                                             |
| `OPENCODE_DELEGATE_THINKING`            | `true`      | Include reasoning blocks in output                                                                                                                   |
| `OPENCODE_DELEGATE_CWD`                 | process cwd | Base working directory                                                                                                                               |
| `OPENCODE_DELEGATE_PREFERRED_PROVIDERS` | none        | Comma-separated provider order when a model has more than one provider                                                                               |

The variables are read by the MCP server unless noted. These are the only variables the plugin honours.

## Standalone server

The MCP server also runs outside Claude Code (needs Bun). Register it in any MCP client with command `bunx` and args `["@lehcode/claudelegate"]`, as in `examples/claude_desktop_config.json`, or with command `bun` and args `["/path/to/clone/dist/index.js"]` for a local clone.

## Development

```bash
bun install
bun run verify                     # typecheck + test + lint + format
bun test test/models.test.ts       # one file
bun test -t "<name>"               # filter by test name
git config core.hooksPath hooks/   # pre-commit (staged lint/format), pre-push (verify)
```

Tests are fixture-based and need no running services.

### `src/`

`src/index.ts` is the MCP server entry point, `dist/index.js` is a committed bundle built with `bun run build`, and CI fails if it's stale, so rebuild and commit `dist/` after changing `src/`. The plugin cache has no `node_modules`, which is why the bundle is committed.

## Releasing

Automated by release-please (`.github/workflows/release.yml`). Conventional commits merged to `main` open or update a release PR that bumps `package.json`, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` and writes `CHANGELOG.md`. Merging it creates the `vX.Y.Z` tag and GitHub release. Never edit versions by hand.

Release PRs are opened with the `RELEASE_PLEASE_TOKEN` secret (PAT or app token with `contents` and `pull-requests` write), because PRs made with the default `GITHUB_TOKEN` don't trigger CI.

The same run publishes the release to npm when the repository variable `NPM_PUBLISH` is `true`; set it to `false` to pause publishing. The `publish` job uses npm trusted publishing (OIDC, no token, provenance automatic), with the trusted publisher on npmjs.com set to repository `lehcode/claudelegate`, workflow `release.yml`. If it fails with E403 right after the trusted publisher was added or changed, re-run the failed job (`gh run rerun <run-id> --failed`).

## License

MIT. See `LICENSE`.
