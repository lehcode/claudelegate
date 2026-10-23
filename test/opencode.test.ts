import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { buildArgs, EventCollector, withSubagentDeny } from "../src/opencode.ts";

const collect = (fixture: string) => {
  const c = new EventCollector();
  for (const line of readFileSync(new URL(`./fixtures/${fixture}`, import.meta.url), "utf8").split(
    "\n",
  ))
    c.push(line);
  return c;
};

describe("EventCollector", () => {
  test("simple text reply", () => {
    const c = collect("simple.jsonl");
    expect(c.sessionId).toBe("ses_f323ce808ffeO9J3dh9kIrHUQN");
    expect(c.text).toBe("hi there");
    expect(c.errors).toEqual([]);
  });
  test("tool calls, tokens and steps", () => {
    const c = collect("tools.jsonl");
    expect(c.toolCalls.map((t) => t.tool)).toEqual(["write", "read"]);
    expect(c.toolCalls[0]?.status).toBe("completed");
    expect(c.steps).toBe(2);
    expect(c.tokens.input).toBe(30581 + 98);
    expect(c.tokens.cacheRead).toBe(256 + 30976);
    expect(c.text).toContain("Done.");
  });
  test("error event", () => {
    const c = collect("error.jsonl");
    expect(c.errors).toEqual(["Model unavailable: nope/fake"]);
  });
  test("non-JSON output falls back to raw text", () => {
    const c = new EventCollector();
    c.push("plain output");
    expect(c.text).toBe("plain output");
  });
});

describe("buildArgs", () => {
  test("full options", () => {
    expect(
      buildArgs({
        prompt: "-do it",
        model: "a/b",
        agent: "build",
        sessionId: "ses_1",
        fork: true,
        auto: true,
        thinking: true,
        title: "t",
        files: ["/x"],
      }),
    ).toEqual([
      "run",
      "--format",
      "json",
      "--standalone",
      "--model",
      "a/b",
      "--agent",
      "build",
      "--session",
      "ses_1",
      "--fork",
      "--auto",
      "--thinking",
      "--title",
      "t",
      "--file",
      "/x",
      "--",
      "-do it",
    ]);
  });
  test("minimal", () => {
    expect(buildArgs({ prompt: "hi" })).toEqual([
      "run",
      "--format",
      "json",
      "--standalone",
      "--",
      "hi",
    ]);
  });
  test("--standalone is always present in buildArgs output", () => {
    expect(buildArgs({ prompt: "hi" })).toContain("--standalone");
    expect(buildArgs({ prompt: "hi", fork: true })).toContain("--standalone");
    expect(
      buildArgs({
        prompt: "-do it",
        model: "a/b",
        agent: "build",
        sessionId: "ses_1",
        fork: true,
        auto: true,
        thinking: true,
        title: "t",
        files: ["/x"],
      }),
    ).toContain("--standalone");
  });
  describe("withSubagentDeny", () => {
    test("undefined returns exact JSON with only the rule", () => {
      expect(withSubagentDeny(undefined)).toBe(
        JSON.stringify({ permissions: [{ action: "subagent", resource: "*", effect: "deny" }] }),
      );
    });
    test("empty string returns same JSON", () => {
      expect(withSubagentDeny("")).toBe(
        JSON.stringify({ permissions: [{ action: "subagent", resource: "*", effect: "deny" }] }),
      );
    });
    test("whitespace-only returns same JSON", () => {
      expect(withSubagentDeny("   ")).toBe(
        JSON.stringify({ permissions: [{ action: "subagent", resource: "*", effect: "deny" }] }),
      );
    });
    test("existing object without permissions keeps other keys and adds permissions [rule]", () => {
      const existing = JSON.stringify({ foo: "bar", baz: 1 });
      const result = JSON.parse(withSubagentDeny(existing));
      expect(result.foo).toBe("bar");
      expect(result.baz).toBe(1);
      expect(result.permissions).toEqual([{ action: "subagent", resource: "*", effect: "deny" }]);
    });
    test("existing object with permissions appends and keeps existing rules first", () => {
      const existing = JSON.stringify({
        permissions: [{ action: "foo", resource: "*", effect: "deny" }],
      });
      const result = JSON.parse(withSubagentDeny(existing));
      expect(result.permissions).toEqual([
        { action: "foo", resource: "*", effect: "deny" },
        { action: "subagent", resource: "*", effect: "deny" },
      ]);
    });
    test("invalid JSON throws", () => {
      expect(() => withSubagentDeny("not json")).toThrow(
        "OPENCODE_CONFIG_CONTENT is not a JSON object with a permissions array; refusing to run without the subagent deny",
      );
    });
    test("permissions not an array throws", () => {
      expect(() => withSubagentDeny(JSON.stringify({ permissions: {} }))).toThrow(
        "OPENCODE_CONFIG_CONTENT is not a JSON object with a permissions array; refusing to run without the subagent deny",
      );
    });
    test("non-object JSON (array) throws", () => {
      expect(() => withSubagentDeny("[]")).toThrow(
        "OPENCODE_CONFIG_CONTENT is not a JSON object with a permissions array; refusing to run without the subagent deny",
      );
    });
    test("non-object JSON (null) throws", () => {
      expect(() => withSubagentDeny("null")).toThrow(
        "OPENCODE_CONFIG_CONTENT is not a JSON object with a permissions array; refusing to run without the subagent deny",
      );
    });
  });
  test("fork without a session is dropped", () => {
    expect(buildArgs({ prompt: "hi", fork: true })).not.toContain("--fork");
  });
  test("thinking: true includes --thinking flag", () => {
    const args = buildArgs({ prompt: "hi", thinking: true });
    expect(args).toContain("--thinking");
  });
  test("thinking: false omits --thinking flag", () => {
    const args = buildArgs({ prompt: "hi", thinking: false });
    expect(args).not.toContain("--thinking");
  });
  test("--thinking appears before -- separator", () => {
    const args = buildArgs({ prompt: "hi", thinking: true });
    expect(args.indexOf("--thinking") < args.indexOf("--")).toBe(true);
  });
});
