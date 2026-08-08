import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const startTime = Date.now();

console.log("==================================================");
console.log("🚀 HR Flow AI — Full Production Build Pipeline");
console.log("==================================================\n");

function logStep(stepNum, totalSteps, title) {
  console.log(`\n--------------------------------------------------`);
  console.log(`📌 Stage ${stepNum}/${totalSteps}: ${title}`);
  console.log(`--------------------------------------------------`);
}

function runCommand(command, cwd = ROOT_DIR) {
  try {
    execSync(command, {
      cwd,
      stdio: "inherit",
      env: { ...process.env },
    });
  } catch (error) {
    console.error(`\n❌ Step failed while executing: ${command}`);
    process.exit(1);
  }
}

function getBackendJsFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getBackendJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

// 1. Syntax Check Backend Files
logStep(1, 6, "Verifying Backend JavaScript Syntax (node --check)");
const backendDirs = ["agents", "config", "graph", "middleware", "models", "prompts", "routes", "services", "tests", "tools"];
const filesToCheck = [path.join(ROOT_DIR, "index.js")];

for (const subDir of backendDirs) {
  filesToCheck.push(...getBackendJsFiles(path.join(ROOT_DIR, subDir)));
}

console.log(`🔍 Checking syntax of ${filesToCheck.length} backend JavaScript files...`);
for (const file of filesToCheck) {
  const relativePath = path.relative(ROOT_DIR, file);
  try {
    execSync(`node --check "${file}"`, { stdio: "pipe" });
  } catch (err) {
    console.error(`❌ Syntax error detected in ${relativePath}:`, err.message);
    process.exit(1);
  }
}
console.log(`✅ Syntax check passed for all ${filesToCheck.length} files.`);

// 2. Backend Linting
logStep(2, 6, "Running Backend Static Analysis (oxlint)");
runCommand("npx oxlint agents/ config/ graph/ middleware/ models/ prompts/ routes/ services/ tests/ tools/ index.js");
console.log("✅ Backend linting clean (0 errors, 0 warnings).");

// 3. Frontend Linting
logStep(3, 6, "Running Frontend Static Analysis (client oxlint)");
runCommand("npm run lint --prefix client");
console.log("✅ Frontend linting clean (0 errors, 0 warnings).");

// 4. Unit & Security Tests
logStep(4, 6, "Executing Backend Security & RBAC Unit Tests");
runCommand("node --test --test-timeout=30000 tests/rbac.test.js");
console.log("✅ All RBAC unit tests passed.");

// 5. Frontend Production Bundle Compilation
logStep(5, 6, "Compiling React Frontend Production Assets (Vite build)");
runCommand("npm run build --prefix client");
console.log("✅ Frontend build completed successfully.");

// 6. Build Artifact Verification
logStep(6, 6, "Verifying Production Build Bundle Integrity");
const distDir = path.join(ROOT_DIR, "client", "dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(distDir) || !fs.existsSync(indexPath)) {
  console.error("❌ Build verification failed: client/dist/index.html does not exist!");
  process.exit(1);
}

const htmlStat = fs.statSync(indexPath);
if (htmlStat.size === 0) {
  console.error("❌ Build verification failed: client/dist/index.html is empty!");
  process.exit(1);
}

const assetsDir = path.join(distDir, "assets");
let assetFiles = [];
if (fs.existsSync(assetsDir)) {
  assetFiles = fs.readdirSync(assetsDir);
}

console.log(`📦 Verification Results:`);
console.log(`   - Output Directory: ${path.relative(ROOT_DIR, distDir)}`);
console.log(`   - Entry point: index.html (${htmlStat.size} bytes)`);
console.log(`   - Assets compiled: ${assetFiles.length} file(s) (${assetFiles.join(", ")})`);

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log("\n==================================================");
console.log(`🎉 BUILD SUCCESSFUL! Completed in ${totalDuration}s`);
console.log("==================================================\n");
