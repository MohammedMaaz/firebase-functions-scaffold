//@ts-nocheck
import * as firebase from "firebase-admin";
import * as funcs from "firebase-functions";

export const db = firebase.firestore;
export const storage = firebase.storage;
export const messaging = firebase.messaging;
export const auth = firebase.auth;
export let functions = funcs;
export const rtdb = firebase.database;

/****************** refs ******************/
const users = db().collection("users");

const config = db().collection("config");

const test = db().collection("test");
/*****************************************/

export const refs = {
  users,
  config,
  test,
};

export const currUser = () => ({
  uid: "server",
});
export const serverTimestamp = () => new Date();
