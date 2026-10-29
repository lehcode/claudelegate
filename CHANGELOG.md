# Changelog

## [0.4.0](https://github.com/lehcode/claudelegate/compare/v0.3.1...v0.4.0) (2026-10-29)


### ⚠ BREAKING CHANGES

* **plugin:** the install id is now claudelegate@lehcode instead of claudelegate@claudelegate.

### Features

* **plugin:** rename marketplace to lehcode ([ede8be1](https://github.com/lehcode/claudelegate/commit/ede8be1318173caab7d1b18aad8e9764d872ce9b))


### Documentation

* **readme:** add CI, CodeQL, release, npm and license badges ([33ae8a0](https://github.com/lehcode/claudelegate/commit/33ae8a0246e2928f202458a71ec75f27c0b650f7))
* **release:** describe npm publishing as live ([bd06fec](https://github.com/lehcode/claudelegate/commit/bd06fecce00d58bb47f40f34dc5f9ae9f88706b4))

## [0.3.1](https://github.com/lehcode/claudelegate/compare/v0.3.0...v0.3.1) (2026-10-29)


### Bug Fixes

* **package:** Updated NPM author property ([4b3845e](https://github.com/lehcode/claudelegate/commit/4b3845e9a2af93ae7090e9246c288274a2340177))

## [0.3.0](https://github.com/lehcode/claudelegate/compare/v0.2.2...v0.3.0) (2026-10-24)


### Features

* **opencode:** deny OpenCode sub-agents in delegated runs ([8c36115](https://github.com/lehcode/claudelegate/commit/8c3611590a859712ed887857d26b42423078bd13))


### Bug Fixes

* **opencode:** set PWD to the run directory for opencode children ([06141f5](https://github.com/lehcode/claudelegate/commit/06141f5983a9e8e15c90b466730af85249ad5809))


### Documentation

* state Claude Code only, Bun requirement and what --auto allows ([4e6ef7d](https://github.com/lehcode/claudelegate/commit/4e6ef7d63303a3f58760331ccf4e81a789bc3e98))

## [0.2.2](https://github.com/lehcode/claudelegate/compare/v0.2.1...v0.2.2) (2026-10-23)


### Documentation

* **changelog:** point commit links at the rewritten history ([28209be](https://github.com/lehcode/claudelegate/commit/28209be7cb697efcbf5bd6c1301df86dd595ff6c))

## [0.2.1](https://github.com/lehcode/claudelegate/compare/v0.2.0...v0.2.1) (2026-10-23)


### Documentation

* **changelog:** point 0.2.0 commit links at the rewritten history ([dfd3147](https://github.com/lehcode/claudelegate/commit/dfd31474af183d2b2581e1e56ddf7403016d5e82))

## [0.2.0](https://github.com/lehcode/claudelegate/compare/v0.1.0...v0.2.0) (2026-10-22)


### ⚠ BREAKING CHANGES

* the plugin installs as claudelegate@claudelegate (was opencode-delegate@claude-opencode-delegate); MCP tools are mcp__plugin_claudelegate_opencode__* (was mcp__plugin_opencode-delegate_opencode__*); the worker is claudelegate:opencode-worker; the npm package and bin are @lehcode/claudelegate and claudelegate. Update permission allowlists.
* the skill is now delegate, invoked as claudelegate:delegate (was opencode-delegate); the slash command keeps its name and is invoked as /claudelegate:opencode.
* **config:** drop OPENCODE_DELEGATE_READ_MODEL in favour of OPENCODE_DELEGATE_DEFAULT_MODEL

### Features

* **hooks:** route all Claude Code built-in subagents to opencode-worker ([9f4722f](https://github.com/lehcode/claudelegate/commit/9f4722fc722d5fe43e5ccc8d8935c2b35a4d8709))
* **hooks:** route general-purpose subagents to opencode-worker ([3f26c35](https://github.com/lehcode/claudelegate/commit/3f26c35bc9f1c8dbda72f7705149d4ea86c82e58))
* **mcp:** delegate through background opencode-worker agents by default ([c988e16](https://github.com/lehcode/claudelegate/commit/c988e16fbb3631684bad101fa4ae2cefc2b0d177))
* **mcp:** read server version from package.json at runtime ([a9b0b03](https://github.com/lehcode/claudelegate/commit/a9b0b0308f31c1f772980b72689a015224631e2c))
* **mcp:** restore opencode MCP server ([df38da6](https://github.com/lehcode/claudelegate/commit/df38da6d0446a6f0a0ea4cacc5ca00d33a5d747f))
* **mcp:** send server instructions that make delegation the default for implementation ([a30dc12](https://github.com/lehcode/claudelegate/commit/a30dc129edafb5f9caf94891f4ec15c293b4ff7a))


### Bug Fixes

* **agent:** drop the worker's edit tools so OpenCode always writes the solution ([e784265](https://github.com/lehcode/claudelegate/commit/e7842657d86031087277519c0e28f1003af8fd83))
* **agent:** make opencode-worker the only caller of MCP delegate ([4160b6b](https://github.com/lehcode/claudelegate/commit/4160b6bb3527237eac3017287f8d1e6a60f021f3))
* **agent:** run opencode directly from a thin opencode-worker ([5c401ae](https://github.com/lehcode/claudelegate/commit/5c401ae67c3a8954f80c1a9adf79c714a59ff111))
* **ci:** fail the dist check on missing or untracked bundle files ([b5a5db9](https://github.com/lehcode/claudelegate/commit/b5a5db949b728e1bd3d5709bce40e088b34b8fc3))
* **ci:** remove build step — no longer bundles to dist/ ([fe6447d](https://github.com/lehcode/claudelegate/commit/fe6447d20b1779bd032cedd075f2d7dbbdc745ad))
* **config:** use opencode's configured default model when none is given ([4c57450](https://github.com/lehcode/claudelegate/commit/4c574503baf28a692355df8895d0752ac44004fd))
* **plugin:** declare the MCP server in plugin.json instead of a root .mcp.json ([36b1800](https://github.com/lehcode/claudelegate/commit/36b1800625426464a48f60ab30e471f995ceff42))
* point plugin homepage/repository to lehcode (not aashahin) ([e632f4e](https://github.com/lehcode/claudelegate/commit/e632f4e91e070c2f04807a2490cb05f79634f60c))


### Code Refactoring

* **config:** drop OPENCODE_DELEGATE_READ_MODEL in favour of OPENCODE_DELEGATE_DEFAULT_MODEL ([1cdf07c](https://github.com/lehcode/claudelegate/commit/1cdf07cef897b7211ad3df1ef9f6111d391a1534))
* rename /claudelegate back to /opencode ([8a4803f](https://github.com/lehcode/claudelegate/commit/8a4803fc253dbcd123b56eaec0574538a0eac82d))
* rename /opencode to /claudelegate and the skill to delegate ([e3ec45b](https://github.com/lehcode/claudelegate/commit/e3ec45bdce97db86aac83ad19b529c5b7bc4252e))
* rename package and plugin to claudelegate ([23c9855](https://github.com/lehcode/claudelegate/commit/23c98556b0230c0541c78d297d0f8b260333ed70))
* rename the opencode-delegate skill to claudelegate ([8d7968e](https://github.com/lehcode/claudelegate/commit/8d7968ebd19ea6bff2f2a14be85792605d595dee))
* strip MCP server, use agent activation instead ([3936057](https://github.com/lehcode/claudelegate/commit/3936057806b454e47b7e793c10454509a04c192c))


### Documentation

* add CLAUDE.md with runtime model and opencode invocation gotchas ([35e7c5e](https://github.com/lehcode/claudelegate/commit/35e7c5e95c223709df5d9a966ef5cb7e71a07f52))
* **agent:** stop retrying timed-out runs; name delegate as the model resolver ([9cfe21c](https://github.com/lehcode/claudelegate/commit/9cfe21c1ea4348bbb95a36fdf6e7cd27b4f9867c))
* document npm install and release flow ([4df64a3](https://github.com/lehcode/claudelegate/commit/4df64a3d898c867085c0c58f3f727765729891e0))
* document restored MCP server tools ([2e2a22c](https://github.com/lehcode/claudelegate/commit/2e2a22c598731a5fd6a63d49a0602e9eb3539c05))
* left-align the README configuration table ([f6c497e](https://github.com/lehcode/claudelegate/commit/f6c497ef2b95272e9e46845fa9e0569a095c17a7))
* point README and CLAUDE.md at the claudelegate skill ([18dce57](https://github.com/lehcode/claudelegate/commit/18dce57348451add544a901a2e37fde4f867209f))
* **readme:** document thin opencode-worker and drop MCP-era claims ([501d133](https://github.com/lehcode/claudelegate/commit/501d133a4689ad7b5b1b97b1140a9b7d030ac13c))
* rename project references to claudelegate ([5ad195c](https://github.com/lehcode/claudelegate/commit/5ad195c049fee6adefbf9391f99805de74570eb6))
* rephrase README to clear Vale warnings ([6dbe2d8](https://github.com/lehcode/claudelegate/commit/6dbe2d8ed999a5fd50701dd7ca95b9d39c3c2bf0))
* rewrite README ([84bac20](https://github.com/lehcode/claudelegate/commit/84bac203163de892931f5648d795e12a8c1c20bd))
