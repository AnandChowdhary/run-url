#!/usr/bin/env node

import https from "https";
import http from "http";
import fs from "fs";
import { spawnSync } from "child_process";
import { join } from "path";
import { URL } from "url";
import { tmpdir } from "os";
import modules from "builtin-modules";

const url = process.argv[2];
if (!url) throw new Error("No URL found");

const parsed = new URL(url);
if (!parsed.protocol) throw new Error("Invalid URL");

const getSafeCwd = () => {
  try {
    return process.cwd();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return tmpdir();
    throw error;
  }
};

const run = (command: string, args: string[], cwd: string) => {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status) process.exit(result.status);
};

const currentDir = getSafeCwd();

fs.mkdtemp(join(tmpdir(), "run-url-"), (error, rootDir) => {
  if (error) throw error;

  const filePath = join(rootDir, "script.js");
  const file = fs.createWriteStream(filePath);

  (parsed.protocol === "https:" ? https : http).get(url, response => {
    if (response.statusCode && response.statusCode >= 400) {
      throw new Error(`Request failed with status ${response.statusCode}`);
    }

    response.pipe(file);
    file.on("finish", () => {
      file.close();
      const jsFile = fs.readFileSync(filePath, { encoding: "utf8" });
      fs.writeFileSync(
        join(rootDir, "package.json"),
        JSON.stringify({ name: "run-url-file", private: true })
      );

      const dependencies = jsFile
        .split("require(")
        .filter(i => i.startsWith('"') || i.startsWith("'"))
        .map(i => {
          if (i.includes("'")) i = i.split("'")[1];
          if (i.includes('"')) i = i.split('"')[1];
          return i;
        })
        .filter(i => !modules.includes(i));

      if (dependencies.length) {
        run(
          "npm",
          [
            "install",
            ...dependencies,
            "--silent",
            "--quiet",
            "--no-progress",
            "--loglevel=silent"
          ],
          rootDir
        );
      }

      run("node", [filePath], currentDir);
      fs.rmdirSync(rootDir, { recursive: true });
    });
  });
});
