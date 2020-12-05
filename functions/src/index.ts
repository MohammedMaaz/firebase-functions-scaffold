//@ts-nocheck
import * as functions from "firebase-functions";
import { withHTTPS } from "./utils/cf";

export const helloWorld = functions.https.onRequest(
  withHTTPS(async (config) => {
    return config;
  })
);
