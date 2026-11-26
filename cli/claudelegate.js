#!/usr/bin/env bun
// npm `bin` entry for running the MCP server standalone (`bunx @lehcode/claudelegate`).
// The plugin itself runs `bun --no-install dist/index.js`; the bundle carries no shebang.
import "../dist/index.js";
