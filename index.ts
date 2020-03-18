#!/usr/bin/env node

import https from "https";
import http from "http";
import fs from "fs";
import mkdirp from "mkdirp";
import { join } from "path";
import { URL } from "url";
import { cd } from "shelljs";

const url = process.argv[2];
if (!url) throw new Error("No URL found");

const parsed = new URL(url);
if (!parsed.protocol) throw new Error("Invalid URL");

const rootDir = join(".cache");

mkdirp(rootDir).then(() => {
  const file = fs.createWriteStream(join(rootDir, "script.js"));
  const request = (parsed.protocol === "https:" ? https : http).get(
    url,
    response => {
      response.pipe(file);
    }
  );
  request.on("close", () => {
    console.log("COMPLETED");
  });
});
