"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-nocheck
const firebase_config_1 = require("./firebase_config");
const metadata = {
    created: (at = firebase_config_1.serverTimestamp(), by = firebase_config_1.currUser().uid) => ({
        createdAt: at,
        createdBy: by,
    }),
    updated: (at = firebase_config_1.serverTimestamp(), by = firebase_config_1.currUser().uid) => ({
        updatedAt: at,
        updatedBy: by,
    }),
};
const eventLog = ({ logType, metadata = null, timestamp = firebase_config_1.serverTimestamp(), }) => {
    return { logType, metadata, timestamp };
};
const image = ({ thumbnail = null, medium = null, large = null }) => ({
    thumbnail,
    medium,
    large,
});
const location = ({ address, city, lat, lng }) => ({
    address,
    city,
    lat,
    lng,
});
const ratingDetails = ({ averageRating = 0, totalRatings = 0 }) => ({
    averageRating,
    totalRatings,
});
const status = ({ value, description = null, timestamp = firebase_config_1.serverTimestamp(), }) => ({
    value,
    description,
    timestamp,
});
const task = ({ taskId, runsAt, hasExecuted = false }) => ({
    taskId,
    runsAt: runsAt instanceof Date ? runsAt : new Date(runsAt),
    hasExecuted,
});
const Protos = {
    metadata,
    image,
    location,
    ratingDetails,
    status,
    task,
    eventLog,
};
exports.default = Protos;
