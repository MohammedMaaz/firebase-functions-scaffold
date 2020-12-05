"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverTimestamp = exports.currUser = exports.refs = exports.rtdb = exports.functions = exports.auth = exports.messaging = exports.storage = exports.db = void 0;
//@ts-nocheck
const firebase = require("firebase-admin");
const funcs = require("firebase-functions");
exports.db = firebase.firestore;
exports.storage = firebase.storage;
exports.messaging = firebase.messaging;
exports.auth = firebase.auth;
exports.functions = funcs;
exports.rtdb = firebase.database;
/****************** refs ******************/
const users = exports.db().collection("users");
const config = exports.db().collection("config");
/*****************************************/
exports.refs = {
    users,
    config,
};
exports.currUser = () => ({
    uid: "server",
});
exports.serverTimestamp = () => new Date();
