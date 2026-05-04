const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const server = http.createServer((request, response) => {
  response.setHeader("content-type", "application/javascript");
  response.end('console.log("run-url-ok")');
});

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "run-url-deleted-cwd-"));
  const command = `cd "${cwd}" && rmdir "${cwd}" && "${process.execPath}" "${path.join(
    __dirname,
    "dist",
    "index.js"
  )}" "http://127.0.0.1:${port}/script.js"`;

  const child = spawn("bash", ["-lc", command], { encoding: "utf8" });
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", chunk => {
    stdout += chunk;
  });
  child.stderr.on("data", chunk => {
    stderr += chunk;
  });

  child.on("exit", code => {
    server.close();

    if (code !== 0) {
      console.error(stderr || stdout);
      process.exit(code || 1);
    }

    if (!stdout.includes("run-url-ok")) {
      console.error(`Expected script output, got: ${stdout}`);
      process.exit(1);
    }
  });
});
