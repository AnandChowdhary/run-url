#!/usr/bin/env node

import https from "https";
import http from "http";
import fs from "fs";
import mkdirp from "mkdirp";
import { join, resolve } from "path";
import { URL } from "url";
import { cd, exec, ls } from "shelljs";
import modules from "builtin-modules";

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
  request.on("finish", () => {
    cd(resolve(rootDir));
    const jsFile = fs.readFileSync(join(rootDir, "script.js"), {
      encoding: "utf8"
    });
    console.log(jsFile);
    exec("npm install");
  });
});
