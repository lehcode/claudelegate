import { describe, expect, test } from "bun:test";
import { accessSync, constants, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));

describe("npm package", () => {
  test("npm pack ships the plugin surfaces and no dev files", () => {
    const r = Bun.spawnSync(["npm", "pack", "--dry-run", "--json", "--ignore-scripts"], {
      cwd: root,
    });
    expect(r.exitCode).toBe(0);
    // npm >= 11 keys the report by package name, older versions return an array.
    const out = JSON.parse(r.stdout.toString());
    const report = Array.isArray(out) ? out[0] : Object.values(out)[0];
    const files: string[] = (report as { files: { path: string }[] }).files.map((f) => f.path);
    for (const f of [
      "dist/index.js",
      "cli/claudelegate.js",
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json",
      "agents/opencode-worker.md",
      "commands/opencode.md",
      "skills/delegate/SKILL.md",
      "scripts/route-to-opencode.sh",
      "scripts/guard-main-thread-mcp.sh",
      "plugin-hooks/hooks.json",
      "README.md",
      "LICENSE",
    ]) {
      expect(files).toContain(f);
    }
    for (const f of files) {
      expect(f).not.toMatch(/^(test|odd|openspec)\//);
      expect(f).not.toMatch(/\.bak\./);
    }
  }, 30000);

  // The claude.ai directory refuses a bundle that starts with #! ("runs bun"), so the shebang lives
  // in a separate npm launcher that no plugin command runs, and the bundle has none.
  test("bin points at an executable bun-shebang launcher that loads the bundle", () => {
    const pkg = readJson("package.json");
    expect(pkg.name).toBe("@lehcode/claudelegate");
    expect(pkg.bin["claudelegate"]).toBe("cli/claudelegate.js");
    const p = join(root, pkg.bin["claudelegate"]);
    accessSync(p, constants.X_OK);
    const src = readFileSync(p, "utf8");
    expect(src.startsWith("#!/usr/bin/env bun\n")).toBe(true);
    expect(src).toContain('import "../dist/index.js";');
  });

  test("the plugin bundle has no shebang", () => {
    expect(readFileSync(join(root, "dist/index.js"), "utf8").startsWith("#!")).toBe(false);
  });

  // A root .mcp.json doubles as this repo's project MCP config, where ${CLAUDE_PLUGIN_ROOT} is unset
  // (`claude doctor`: "Missing environment variables: CLAUDE_PLUGIN_ROOT"). Declare it in plugin.json.
  test("the MCP server is declared inline in plugin.json, not in a root .mcp.json", () => {
    expect(() => accessSync(join(root, ".mcp.json"))).toThrow();
    expect(readJson(".claude-plugin/plugin.json").mcpServers).toEqual({
      opencode: { command: "bun", args: ["--no-install", "${CLAUDE_PLUGIN_ROOT}/dist/index.js"] },
    });
  });

  // Delegation must never block the main thread, even when Claude asks to wait for the worker.
  test("opencode-worker always runs in the background", () => {
    const md = readFileSync(join(root, "agents/opencode-worker.md"), "utf8");
    const frontmatter = md.split(/^---$/m)[1];
    expect(frontmatter).toMatch(/^background: true$/m);
  });

  // The worker supervises; OpenCode writes. Without edit tools it has no direct way to spend Claude tokens writing the solution (Bash stays, for tests).
  test("opencode-worker has no edit tools", () => {
    const md = readFileSync(join(root, "agents/opencode-worker.md"), "utf8");
    const tools = /^tools: (.*)$/m.exec(md.split(/^---$/m)[1] ?? "")?.[1] ?? "";
    const mcp = "mcp__plugin_claudelegate_opencode__";
    expect(tools.split(/,\s*/)).toEqual([
      "Read",
      "Grep",
      "Glob",
      "Bash",
      "ToolSearch",
      `${mcp}delegate`,
      `${mcp}list_models`,
      `${mcp}list_sessions`,
    ]);
  });

  test("versions are in sync across manifests", () => {
    const v = readJson("package.json").version;
    expect(readJson(".claude-plugin/plugin.json").version).toBe(v);
    expect(readJson(".claude-plugin/marketplace.json").plugins[0].version).toBe(v);
    expect(readJson(".release-please-manifest.json")["."]).toBe(v);
  });
});
