"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withHTTPS = exports.withSuperAdmin = exports.withAdmin = exports.withCallable = exports.withTriggerTask = exports.withIdempotency = exports.withRetryEnabled = exports.withGlobalConfig = exports.changeTaskStatus = exports.allowedFirestoreErrors = exports.callable_error = void 0;
// @ts-nocheck
const firebase_config_1 = require("../utils/firebase_config");
const globalConfig_1 = require("../globalConfig");
const firestore_1 = require("../firestore");
const preconditions_1 = require("./preconditions");
const errors = {
    cancelled: "Operation cancelled due to an unexpected error",
    unknown: "An unknown error occurred",
    "invalid-argument": "Invalid argument provided",
    "deadline-exceeded": "Deadline exceeded for the task",
    "not-found": "Resource not found",
    "already-exists": "The requested resource already exists",
    "permission-denied": "You have insufficient permissions to perform this operation",
    "resource-exhausted": "resource-exhausted",
    "failed-precondition": "Failed precondition for the requested operation",
    aborted: "Operation aborted due to an error",
    "out-of-range": "Out of range",
    unimplemented: "This feature is currently unimplemented",
    internal: "An internal server error occurred",
    unavailable: "The service requested is currently unavailable",
    "data-loss": "Data loss",
    unauthenticated: "User is not signed in",
};
exports.callable_error = (code, msg, details) => {
    let _msg = errors[code];
    if (!_msg) {
        code = "unknown";
        _msg = errors[code];
    }
    return new firebase_config_1.functions.https.HttpsError(code, msg || _msg, details);
};
//TODO: Add more allowable errors such as for auth, storage etc and add an error code delibrate user errors
exports.allowedFirestoreErrors = [
    "cancelled",
    "deadline-exceeded",
    "aborted",
    "internal",
    "unavailable",
];
const getTaskArgs = (args, config = {}) => {
    var _a;
    let first, rest;
    if (((_a = args[0]) === null || _a === void 0 ? void 0 : _a.__type) === "config") {
        first = Object.assign(Object.assign({}, args[0]), config);
        rest = args.slice(1);
    }
    else {
        first = Object.assign(Object.assign({}, config), { __type: "config" });
        rest = args || [];
    }
    return [first, rest];
};
const alreadyExists = (eventId, data = {}) => firebase_config_1.db().runTransaction((t) => {
    const eventRef = firebase_config_1.db().collection("triggerEvents").doc(eventId);
    return t.get(eventRef).then((eventDoc) => {
        if (eventDoc.exists)
            return true;
        else {
            t.set(eventRef, Object.assign({ createdAt: firebase_config_1.serverTimestamp() }, data));
            return false;
        }
    });
});
exports.changeTaskStatus = ({ docRef, taskId, status, payload = null, exception = false, batch = null, }) => {
    try {
        let ref = docRef.collection("tasks").doc(taskId);
        let data = {
            status,
            updatedAt: new Date(),
        };
        if (payload)
            data.payload = payload;
        if (batch)
            return batch.set(ref, data, { merge: true });
        else
            return ref.set(data, { merge: true }).catch((error) => {
                console.error(`Error changing ${docRef.path}/tasks/${taskId} status to ${status}:`, error);
                if (exception)
                    throw error;
            });
    }
    catch (error) {
        console.error(`Error changing ${docRef.path}/tasks/${taskId} status to ${status}:`, error);
        if (exception)
            throw error;
    }
};
exports.withGlobalConfig = (task = ({ global }) => Promise.resolve(), configIds, taskName = "") => {
    return async (...args) => {
        let first, rest;
        try {
            let configMap = {};
            if (Array.isArray(configIds)) {
                let results = await Promise.all(configIds.map(globalConfig_1.default.get));
                results.forEach((config, i) => (configMap[configIds[i]] = config));
            }
            else {
                let results = await firestore_1.default.get_list(firebase_config_1.refs.config.get());
                for (let res of results) {
                    configMap[res.id] = Object.keys(res).reduce((acc, key) => {
                        if (key !== "id" && key !== "_original")
                            acc[key] = res[key].value;
                        return acc;
                    }, {});
                }
            }
            [first, rest] = getTaskArgs(args, { global: configMap });
        }
        catch (error) {
            console.error(`${taskName} withGlobalConfig Error:`, error);
            return;
        }
        return task(first, ...rest);
    };
};
exports.withRetryEnabled = (task = () => Promise.resolve(), taskName = "") => {
    return async (...args) => {
        try {
            let [first, rest] = getTaskArgs(args);
            const response = await task(first, ...rest);
            return response;
        }
        catch (error) {
            console.error(`${taskName} Error:`, error);
            if (exports.allowedFirestoreErrors.includes(error.code)) {
                console.log(`Retrying ${taskName} job because of a transient error`);
                throw error;
            }
        }
    };
};
exports.withIdempotency = (task = () => Promise.resolve(), eventData = {}, taskName = "") => {
    return async (...args) => {
        let first, rest;
        try {
            let eventId;
            for (let arg of args)
                if (typeof arg === "object" && typeof arg.eventId === "string")
                    eventId = arg.eventId;
            if (!eventId)
                throw `eventId not found`;
            const alreadyExists = await alreadyExists(eventId, eventData);
            if (alreadyExists) {
                console.warn(`${taskName} already invoked. Terminating now...`);
                return;
            }
            [first, rest] = getTaskArgs(args);
        }
        catch (error) {
            console.error(`${taskName} withIdempotency Error:`, error);
            return;
        }
        return task(first, ...rest);
    };
};
exports.withTriggerTask = (task = () => Promise.resolve()) => {
    return async (...args) => {
        let first, rest, docRef, taskId;
        try {
            let change;
            for (let arg of args)
                if (typeof arg === "object" &&
                    typeof arg.after === "object" &&
                    typeof arg.before === "object")
                    change = arg;
            if (!change)
                throw `change not found`;
            if (!change.after.exists)
                return;
            const { status: prevStatus, updatedAt: prevTime } = change.before.exists
                ? change.before.data()
                : {
                    updatedAt: firebase_config_1.db.Timestamp.fromDate(new Date()),
                };
            const { status: newStatus, updatedAt: newTime } = change.after.data();
            if ((prevStatus === newStatus &&
                prevTime.toDate().getTime() === newTime.toDate().getTime()) ||
                newStatus !== "triggered")
                return;
            docRef = change.after.ref.parent.parent;
            taskId = change.after.id;
            await exports.changeTaskStatus({ docRef, taskId, status: "pending" });
            [first, rest] = getTaskArgs(args);
            try {
                await task(first, ...rest);
            }
            catch (error) {
                throw {
                    error,
                    __ignored: true,
                };
            }
            await exports.changeTaskStatus({ docRef, taskId, status: "completed" });
        }
        catch (error) {
            await exports.changeTaskStatus({
                docRef,
                taskId,
                status: "failed",
                payload: { error: JSON.parse(JSON.stringify(error)) },
            });
            if (error.__ignored)
                throw error.error;
            else
                console.error(`${docRef.path}/tasks/${taskId} withTriggerTask Error:`, error);
        }
    };
};
exports.withCallable = (task = () => Promise.resolve(), testModeAuth = false, taskName = "") => {
    return async (...args) => {
        let first, rest;
        try {
            let context;
            for (let arg of args)
                if (typeof arg === "object" && arg.rawRequest)
                    context = arg;
            if (!context)
                throw exports.callable_error("not-found", `context not found`);
            if (!testModeAuth)
                preconditions_1.verifyAuthentication(context);
            else
                context.auth = testModeAuth;
            [first, rest] = getTaskArgs(args);
            try {
                const response = await task(first, ...rest);
                return response;
            }
            catch (error) {
                throw {
                    error,
                    __ignored: true,
                };
            }
        }
        catch (error) {
            if (error.__ignored)
                error = error.error;
            else
                console.error(`${taskName} withCallable Error:`, error);
            if (error.httpErrorCode)
                throw error;
            else
                throw exports.callable_error("unknown", undefined, error);
        }
    };
};
exports.withAdmin = (task = () => Promise.resolve(), testMode = false, taskName = "") => {
    return exports.withCallable(async (config, data, context) => {
        try {
            if (!testMode)
                preconditions_1.verifyIsAdmin(context.auth.token);
            try {
                const response = await task(config, data, context);
                return response;
            }
            catch (error) {
                console.log("error", error);
                throw {
                    error,
                    __ignored: true,
                };
            }
        }
        catch (error) {
            if (error.__ignored)
                error = error.error;
            else
                console.error(`${taskName} withAdmin Error:`, error);
            if (error.httpErrorCode)
                throw error;
            else
                throw exports.callable_error("unknown", undefined, error);
        }
    }, testMode, taskName);
};
exports.withSuperAdmin = (task = () => Promise.resolve(), testMode = false, taskName = "") => {
    return exports.withCallable(async (config, data, context) => {
        try {
            if (!testMode)
                preconditions_1.verifyIsSuperAdmin(context.auth.token);
            try {
                const response = await task(config, data, context);
                return response;
            }
            catch (error) {
                console.log("error", error);
                throw {
                    error,
                    __ignored: true,
                };
            }
        }
        catch (error) {
            if (error.__ignored)
                error = error.error;
            else
                console.error(`${taskName} withSuperAdmin Error:`, error);
            if (error.httpErrorCode)
                throw error;
            else
                throw exports.callable_error("unknown", undefined, error);
        }
    }, testMode, taskName);
};
exports.withHTTPS = (task, opts = { apiKey = null, allowCors = true }, taskName = "") => {
    return async (...args) => {
        let first, rest, req, res;
        try {
            req = args[1];
            res = args[2];
            preconditions_1.verifyAPIKey(opts.apiKey || req.get("X-api-key"));
            [first, rest] = getTaskArgs(args, {
                https: { params: req.params, data: req.body },
            });
            try {
                if (opts.allowCors)
                    res.append("Access-Control-Allow-Origin", ["*"]);
                const response = await task(first, ...rest);
                if (!res.finished)
                    res.json(response || null);
            }
            catch (error) {
                throw {
                    error,
                    __ignored: true,
                };
            }
        }
        catch (error) {
            if (error.__ignored)
                error = error.error;
            console.error(`${taskName} withHTTPS Error:`, error);
            res === null || res === void 0 ? void 0 : res.status(500).json(error);
        }
    };
};
