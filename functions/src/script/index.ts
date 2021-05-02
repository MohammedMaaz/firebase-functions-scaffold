//@ts-nocheck

import { withHTTPS } from "../utils/cf";
import * as promiseRetry from "promise-retry";
import lib from "./lib";

const run = withHTTPS(async ({ https }) => {
  const {
    name,
    args = [],
    retries = 1,
    retryBackoffFactor = 1.36916,
  } = https.data;
  if (!name || typeof name !== "string")
    throw "Invalid value of parameter 'name'. Required a non-empty string.";

  const script = Script.lib[name];
  if (!script || name === "run")
    throw `No matching script found for name: '${name}'`;

  return promiseRetry(
    (retry, number) => script(...args).catch((e) => retry(e)),
    {
      retries: Math.max(0, Math.min(retries, 20)),
      factor: retryBackoffFactor,
      minTimeout: 1000,
      randomize: false,
    }
  );
}, {});

const Script = {
  run,
  lib,
};

export default Script;
