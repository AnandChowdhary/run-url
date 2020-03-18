#!/usr/bin/env node

import https from "https";
import http from "http";
import fs from "fs";
import mkdirp from "mkdirp";
import { join } from "path";
import { URL } from "url";

const url = process.argv[2];
if (!url) throw new Error("No URL found");

const parsed = new URL(url);
if (!parsed.protocol) throw new Error("Invalid URL");

const rootDir = join(".cache");

const file = fs.createWriteStream(join(rootDir, "script.js"));
const request = (parsed.protocol === "https:" ? https : http).get(url, function(
  response
) {
  response.pipe(file);
});
