//@ts-nocheck
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

import { withHTTPS } from "./utils/cf";
import test from "./test";
import Script from "./script";

export const helloWorld = functions.https.onRequest(
  withHTTPS(async (config) => {
    console.log("hi");
    return config;
  }, {})
);

export const setGlobalConfig = functions.https.onRequest(
  Script.set_global_config
);

export const testFunction = functions.https.onRequest(test);
