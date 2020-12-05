const json = require("../env.json");

function getConfigCommand(obj, prefix = "", command = "", level = 1) {
  for (let [key, val] of Object.entries(obj)) {
    if (typeof val === "object")
      command = getConfigCommand(val, `${prefix}${key}.`, command, level + 1);
    else command += `${prefix}${key}="${val} "`;
  }

  if (level === 1) command = "firebase functions:config:set " + command;
  return command;
}

console.log(getConfigCommand(json));
