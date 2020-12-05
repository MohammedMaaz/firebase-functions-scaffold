"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToQueryString = exports.capitalize = exports.isValidNum = exports.ignoreErrors = exports.uidFromPrivate = exports.uidFromProfile = exports.randomInt = exports.chunk = exports.promiseWithRetry = exports.dynamicImport = exports.fileNameWithoutExtension = exports.reduceToArea = exports.delay = exports.arraySymmetricDifference = exports.arrayDifference = exports.arrayIntersection = exports.docDataToData = exports.removeKeys = exports.randHashString = exports.querySnapToData = exports.docToData = void 0;
//@ts-nocheck
const promiseRetry = require("promise-retry");
exports.docToData = (doc) => doc.exists ? Object.assign({ id: doc.id, _original: doc }, doc.data()) : null;
exports.querySnapToData = (snap) => {
    let docs = [];
    if (!snap.empty)
        docs = snap.docs.map((doc) => exports.docToData(doc));
    return { docs, _original: snap };
};
exports.randHashString = (len) => {
    return "x".repeat(len).replace(/[xy]/g, (c) => {
        let r = (Math.random() * 16) | 0, v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
exports.removeKeys = (obj, keys) => {
    let newObj = Object.assign({}, obj);
    for (let key of keys) {
        delete newObj[key];
    }
    return newObj;
};
exports.docDataToData = (docData) => {
    return exports.removeKeys(docData, ["id", "_original"]);
};
//arr1 n arr2
exports.arrayIntersection = (arr1, arr2) => arr1.filter((value) => arr2.includes(value));
//arr1 - arr2
exports.arrayDifference = (arr1, arr2) => arr1.filter((x) => !arr2.includes(x));
//(arr1 U arr2) - (arr1 n arr2)
exports.arraySymmetricDifference = (arr1, arr2) => arr1
    .filter((x) => !arr2.includes(x))
    .concat(arr2.filter((x) => !arr1.includes(x)));
exports.delay = (millis) => new Promise((res) => setTimeout(res, millis));
exports.reduceToArea = ({ width, height, area }) => {
    const imageArea = width * height;
    const ratio = Math.sqrt(imageArea / area);
    const shouldTransform = imageArea > area;
    return {
        width: shouldTransform ? Math.round(width / ratio) : width,
        height: shouldTransform ? Math.round(height / ratio) : height,
    };
};
exports.fileNameWithoutExtension = (path) => {
    const dotIndex = path.lastIndexOf(".");
    return path.slice(0, dotIndex);
};
exports.dynamicImport = (...module_names) => {
    return Promise.all(module_names.map((name) => Promise.resolve().then(() => require(name))));
};
exports.promiseWithRetry = (promise, importance = "low") => {
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
exports.chunk = (arr, chunkSize) => {
    let i, j, chunks = [];
    for (i = 0, j = arr.length; i < j; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
};
exports.randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
exports.uidFromProfile = (profile) => profile._original.ref.parent.parent.id;
exports.uidFromPrivate = (_private) => _private._original.ref.parent.parent.parent.parent.id;
exports.ignoreErrors = async (task, ...args) => {
    try {
        const result = await task(...args);
        return result;
    }
    catch (error) {
        console.error("Ignoring Error:", error);
    }
};
exports.isValidNum = (value) => {
    return value !== null && !isNaN(value);
};
exports.capitalize = (str) => str[0].toUpperCase() + str.slice(1);
function jsonToQueryString(json) {
    const keys = Object.keys(json || {});
    if (keys.length)
        return ("?" +
            keys
                .map(function (key) {
                return encodeURIComponent(key) + "=" + encodeURIComponent(json[key]);
            })
                .join("&"));
    else
        return "";
}
exports.jsonToQueryString = jsonToQueryString;
