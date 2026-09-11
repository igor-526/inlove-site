import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const selector = "ut-dep-controlled-selector";
const apiPort = 43171;
const sitePort = 43172;
const apiBaseUrl = `http://127.0.0.1:${apiPort}/api`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
  }
  return result;
}

async function waitForSite() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${sitePort}/about`);
      if (response.status < 500) return response;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("production server did not become ready");
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  }));
  return nested.flat();
}

// UT-DEP-01: valid inputs pass; blank/invalid inputs fail without echoing values.
run("node", ["scripts/validate-production-config.mjs"], {
  env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: apiBaseUrl, NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY: selector },
});
const invalid = spawnSync("node", ["scripts/validate-production-config.mjs"], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: "relative/path", NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY: "  " },
});
assert(invalid.status !== 0, "invalid release inputs must fail");
assert(!`${invalid.stdout}${invalid.stderr}`.includes("relative/path"), "validation must not echo input values");

// UT-DEP-03: wiring is explicit, release destination is unchanged, and Helm has no late public env.
const workflow = await readFile(path.join(root, ".github/workflows/check_and_deploy.yml"), "utf8");
const dockerfile = await readFile(path.join(root, "Dockerfile"), "utf8");
const dockerignore = await readFile(path.join(root, ".dockerignore"), "utf8");
const helmFiles = await listFiles(path.join(root, ".helm"));
const helm = (await Promise.all(helmFiles.map((file) => readFile(file, "utf8")))).join("\n");
assert(workflow.includes("node scripts/validate-production-config.mjs"), "workflow validation is missing");
assert(workflow.includes("NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY=${{ secrets.EQUESTRIAN_SERVICE_KEY }}"), "selector build arg wiring is missing");
assert(workflow.includes("ghcr.io/igor-526/inlove-site"), "release image destination changed");
assert(workflow.includes("--namespace consumer"), "release namespace changed");
assert(dockerfile.includes("RUN node scripts/validate-production-config.mjs"), "Docker build validation is missing");
assert(/^\.env$/m.test(dockerignore) && /^node_modules$/m.test(dockerignore) && /^\.next$/m.test(dockerignore), "Docker context must exclude local env and generated artifacts");
assert(!helm.includes("NEXT_PUBLIC_API_BASE_URL") && !helm.includes("NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY"), "Helm must not provide late NEXT_PUBLIC runtime env");

// UT-DEP-02: build the actual Next production artifact, start it without runtime
// public env, and observe the exact selector header at a controlled mock API.
run("npm", ["run", "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: apiBaseUrl, NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY: selector },
});

const observed = [];
const api = createServer((request, response) => {
  observed.push({
    authorization: request.headers.authorization,
    cookie: request.headers.cookie,
    selector: request.headers["x-equestrian-service-key"],
  });
  response.writeHead(200, { "content-type": "application/json" });
  response.end("[]");
});
await new Promise((resolve) => api.listen(apiPort, "127.0.0.1", resolve));

const runtimeEnv = { ...process.env, PORT: String(sitePort) };
delete runtimeEnv.NEXT_PUBLIC_API_BASE_URL;
delete runtimeEnv.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY;
const site = spawn("npm", ["run", "start", "--", "-p", String(sitePort)], {
  cwd: root,
  env: runtimeEnv,
  stdio: ["ignore", "pipe", "pipe"],
});

try {
  await waitForSite();
  assert(observed.length > 0, "production artifact made no API request");
  assert(observed.every((request) => request.selector === selector), "production artifact sent an incorrect selector header");
  assert(observed.every((request) => !request.authorization && !request.cookie), "production artifact sent CMS credentials");
} finally {
  site.kill("SIGTERM");
  api.close();
}

const buildId = (await readFile(path.join(root, ".next/BUILD_ID"), "utf8")).trim();
const digest = createHash("sha256")
  .update(await readFile(path.join(root, "Dockerfile")))
  .update(await readFile(path.join(root, ".github/workflows/check_and_deploy.yml")))
  .update(buildId)
  .digest("hex");

console.log(`UT-DEP-01..03 PASS; sanitized production config/artifact digest sha256:${digest}`);
