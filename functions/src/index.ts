//@ts-nocheck
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

import { withHTTPS } from "./utils/cf";
import test from "./test";
import Script from "./script";

export const helloWorld = functions.https.onRequest(
  withHTTPS(async () => {
    console.log("Hello World!");
    return "Hello World";
  }, {})
);

export const runScript = functions.https.onRequest(Script.run);

export const testFunction = functions.https.onRequest(test);
