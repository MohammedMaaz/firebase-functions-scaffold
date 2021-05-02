fs = require("fs").promises;
const { execSync } = require("child_process");
const config = require("../env.json");
const setConfig = require("./setConfig");

async function createFirebaserc() {
  const fileJson = {
    projects: {
      default: config.project.id,
    },
  };

  const path = __dirname.split("\\").slice(0, -2).join("\\") + "\\.firebaserc";
  const method = "utf8";

  try {
    await fs.readFile(path, method);
  } catch (error) {
    if (error instanceof Error && error.code === "ENOENT") {
      await fs.writeFile(path, JSON.stringify(fileJson, null, 2), method);
    } else throw error;
  }
}

(async function () {
  console.log("\n1. Creating .firebaserc file\n");
  await createFirebaserc();

  console.log("\n2. Installing firebase-tools globally\n");
  execSync("yarn global add firebase-tools", { stdio: "inherit" });

  console.log("\n3. Logging in to firebase\n");
  execSync("firebase login", { stdio: "inherit" });

  console.log("\n4. Use firebase default project\n");
  execSync("firebase use default", { stdio: "inherit" });

  console.log("\n5. Set config define by env.json\n");
  setConfig();
})();
