"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAPIKey = exports.verifyValidPhoneNumber = exports.verifyValidRating = exports.verifyIsSuperAdmin = exports.verifyIsAdmin = exports.verifyIsNumber = exports.verifyEnum = exports.verifyDocNotExists = exports.verifyDocExists = exports.verifyAuthentication = void 0;
//@ts-nocheck
const cf_1 = require("./cf");
const firebase_config_1 = require("./firebase_config");
exports.verifyAuthentication = (context) => {
    if (!context.auth)
        throw cf_1.callable_error("unauthenticated", `User is not signed in`);
};
exports.verifyDocExists = (firebaseDoc) => {
    var _a;
    if (!firebaseDoc.exists)
        throw cf_1.callable_error("not-found", `doc:${(_a = firebaseDoc === null || firebaseDoc === void 0 ? void 0 : firebaseDoc.ref) === null || _a === void 0 ? void 0 : _a.path} does not exist`);
};
exports.verifyDocNotExists = (doc) => {
    if (doc)
        throw cf_1.callable_error("already-exists", `doc:${doc._original.ref.path} already exists`);
};
exports.verifyEnum = (value, enums, field = "") => {
    if (!enums.includes(value))
        throw cf_1.callable_error("invalid-argument", `Invalid value of ${field}:${value} provided. Expected one of ${enums.join(" | ")}`);
};
exports.verifyIsNumber = (value, keyName) => {
    if (typeof value !== "number" || isNaN(Number(value)))
        throw cf_1.callable_error("invalid-argument", `Invalid type of ${keyName}:${value} provided. Expected a number`);
};
exports.verifyIsAdmin = (auth) => {
    if (auth.token.admin !== true && auth.token.superAdmin !== true)
        throw cf_1.callable_error("permission-denied", "Admin pervilages needed to perform this operation");
};
exports.verifyIsSuperAdmin = (auth) => {
    if (auth.token.superAdmin !== true)
        throw cf_1.callable_error("permission-denied", "Super Admin pervilages needed to perform this operation");
};
exports.verifyValidRating = (rating) => {
    exports.verifyIsNumber(rating, "rating");
    if (rating < 1 || rating > 5)
        throw cf_1.callable_error("out-of-range", `Invalid rating:${rating} provided. Rating should be in the range 1 to 5`);
};
exports.verifyValidPhoneNumber = (phoneNumber) => {
    const pattern = /^((\+92)|(0092))-{0,1}3{1}\d{2}-{0,1}\d{7}$|^0{0,1}3{1}\d{10}$|^0{0,1}3{1}\d{2}-\d{7}$/g;
    if (!pattern.test(phoneNumber))
        throw `invalid phoneNumber:${phoneNumber}`;
};
exports.verifyAPIKey = (apiKey) => {
    if (apiKey !== firebase_config_1.functions.config().https.api_key)
        throw "invalid api key provided!";
};
