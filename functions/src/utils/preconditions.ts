//@ts-nocheck
import { callable_error } from "./cf";
import Geo from "../geolocation";
import { uidFromProfile, uidFromPrivate } from "./utils";
import { functions } from "./firebase_config";

export const verifyAuthentication = (context) => {
  if (!context.auth)
    throw callable_error("unauthenticated", `User is not signed in`);
};

export const verifyDocExists = (firebaseDoc) => {
  if (!firebaseDoc.exists)
    throw callable_error(
      "not-found",
      `doc:${firebaseDoc?.ref?.path} does not exist`
    );
};

export const verifyDocNotExists = (doc) => {
  if (doc)
    throw callable_error(
      "already-exists",
      `doc:${doc._original.ref.path} already exists`
    );
};

export const verifyEnum = (value, enums, field = "") => {
  if (!enums.includes(value))
    throw callable_error(
      "invalid-argument",
      `Invalid value of ${field}:${value} provided. Expected one of ${enums.join(
        " | "
      )}`
    );
};

export const verifyIsNumber = (value, keyName) => {
  if (typeof value !== "number" || isNaN(Number(value)))
    throw callable_error(
      "invalid-argument",
      `Invalid type of ${keyName}:${value} provided. Expected a number`
    );
};

export const verifyIsAdmin = (auth) => {
  if (auth.token.admin !== true && auth.token.superAdmin !== true)
    throw callable_error(
      "permission-denied",
      "Admin pervilages needed to perform this operation"
    );
};

export const verifyIsSuperAdmin = (auth) => {
  if (auth.token.superAdmin !== true)
    throw callable_error(
      "permission-denied",
      "Super Admin pervilages needed to perform this operation"
    );
};

export const verifyValidRating = (rating) => {
  verifyIsNumber(rating, "rating");
  if (rating < 1 || rating > 5)
    throw callable_error(
      "out-of-range",
      `Invalid rating:${rating} provided. Rating should be in the range 1 to 5`
    );
};

export const verifyValidPhoneNumber = (phoneNumber) => {
  const pattern = /^((\+92)|(0092))-{0,1}3{1}\d{2}-{0,1}\d{7}$|^0{0,1}3{1}\d{10}$|^0{0,1}3{1}\d{2}-\d{7}$/g;
  if (!pattern.test(phoneNumber)) throw `invalid phoneNumber:${phoneNumber}`;
};

export const verifyAPIKey = (
  provided,
  reqd = functions.config().https.api_key
) => {
  if (!reqd) reqd = functions.config().https.api_key;
  if (provided !== reqd) throw "invalid api key provided!";
};
