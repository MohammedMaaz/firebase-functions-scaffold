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
  await createFirebaserc();
  execSync("firebase use default", { stdio: "inherit" });
  setConfig();
})();
