const { exec, spawn } = require("child_process");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
void (function () {
  spawn(npm, ["run", "_shell"], {
    stdio: "inherit",
    env: { ...process.env, mode: "shell" },
  });
  const watch = exec("npm run watch");
  watch.stderr.on("data", function (data) {
    console.error("TSC ERROR:", data.toString());
  });
})();
