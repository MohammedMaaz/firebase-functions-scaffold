const { exec, spawn } = require("child_process");

void (function () {
  const env = process.argv[2];

  spawn(
    `firebase use ${env} && npm run build && npm run set-env:${env} && firebase emulators:start --only functions`,
    {
      stdio: "inherit",
      env: { ...process.env, mode: "shell" },
      shell: true,
    }
  );

  const watch = exec("npm run watch");
  watch.stderr.on("data", function (data) {
    console.error("TSC ERROR:", data.toString());
  });
})();
