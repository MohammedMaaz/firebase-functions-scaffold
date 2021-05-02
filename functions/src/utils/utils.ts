//@ts-nocheck
import * as promiseRetry from "promise-retry";
import { functions } from "./firebase_config";

export const docToData = (doc) =>
  doc.exists ? { id: doc.id, _original: doc, ...doc.data() } : null;

export const querySnapToData = (snap) => {
  let docs = [];
  if (!snap.empty) docs = snap.docs.map((doc) => docToData(doc));
  return { docs, _original: snap };
};

export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomFloat = (min, max) => Math.random() * (max - min) + min;

export const randomHashString = (len) => {
  return "x".repeat(len).replace(/[xy]/g, (c) => {
    let r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const randomString = (len) =>
  [...Array(len)].map(() => Math.random().toString(36)[2]).join("");

export function randomDate(d1, d2) {
  if (d1 instanceof Date) d1 = d1.getTime();
  if (d2 instanceof Date) d2 = d2.getTime();
  return new Date(randomInt(d1, d2));
}

export const removeKeys = (obj, keys) => {
  let newObj = Object.assign({}, obj);
  for (let key of keys) {
    delete newObj[key];
  }
  return newObj;
};

export const docDataToData = (docData) => {
  return removeKeys(docData, ["id", "_original"]);
};

//arr1 n arr2
export const arrayIntersection = (arr1, arr2) =>
  arr1.filter((value) => arr2.includes(value));

//arr1 - arr2
export const arrayDifference = (arr1, arr2) =>
  arr1.filter((x) => !arr2.includes(x));

//(arr1 U arr2) - (arr1 n arr2)
export const arraySymmetricDifference = (arr1, arr2) =>
  arr1
    .filter((x) => !arr2.includes(x))
    .concat(arr2.filter((x) => !arr1.includes(x)));

export const delay = (millis) => new Promise((res) => setTimeout(res, millis));

export const reduceToArea = ({ width, height, area }) => {
  const imageArea = width * height;
  const ratio = Math.sqrt(imageArea / area);

  const shouldTransform = imageArea > area;

  return {
    width: shouldTransform ? Math.round(width / ratio) : width,
    height: shouldTransform ? Math.round(height / ratio) : height,
  };
};

export const fileNameWithoutExtension = (path) => {
  const dotIndex = path.lastIndexOf(".");
  return path.slice(0, dotIndex);
};

export const dynamicImport = (...module_names) => {
  return Promise.all(module_names.map((name) => import(name)));
};

export const promiseWithRetry = (promise, importance = "low") => {
  let retries, factor;
  switch (importance) {
    case "high":
      retries = 10;
      factor = 1.36916; //1 min
      break;
    case "medium":
      retries = 5;
      factor = 1.65726; //30 secs
      break;
    case "low":
      retries = 3;
      factor = 1.36549; //15 secs
      break;
    default:
      retries = 10;
      factor = 1.36916; //1 min
  }

  return promiseRetry((retry, number) => promise.catch((e) => retry(e)), {
    retries,
    factor,
    minTimeout: 1000,
    randomize: false,
  });
};

export const chunk = (arr, chunkSize) => {
  let i,
    j,
    chunks = [];
  for (i = 0, j = arr.length; i < j; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

export const uidFromProfile = (profile) =>
  profile._original.ref.parent.parent.id;
export const uidFromPrivate = (_private) =>
  _private._original.ref.parent.parent.parent.parent.id;

export const ignoreErrors = async (task, ...args) => {
  try {
    const result = await task(...args);
    return result;
  } catch (error) {
    console.error("Ignoring Error:", error);
  }
};

export const isValidNum = (value) => {
  return value !== null && !isNaN(value);
};

export const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

export function jsonToQueryString(json) {
  const keys = Object.keys(json || {});

  if (keys.length)
    return (
      "?" +
      keys
        .map(function (key) {
          return encodeURIComponent(key) + "=" + encodeURIComponent(json[key]);
        })
        .join("&")
    );
  else return "";
}

export function getCFUrl(cfName) {
  return `https://${
    functions.config().project.cf_region || functions.config().project.region
  }-${functions.config().project.id}.cloudfunctions.net/${cfName}`;
}

export async function PromiseAll(promises, batchSize = 20) {
  if (!batchSize || !Number.isInteger(batchSize) || batchSize <= 0)
    return Promise.all(promises);

  let position = 0;
  let results = [];
  while (position < promises.length) {
    const batch = promises.slice(position, position + batchSize);
    results = [...results, ...(await Promise.all(batch))];
    position += batchSize;
  }
  return results;
}
