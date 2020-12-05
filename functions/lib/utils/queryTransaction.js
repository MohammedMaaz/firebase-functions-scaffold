"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-nocheck
const firebase_config_1 = require("./firebase_config");
const utils_1 = require("./utils");
function stopListener() {
    for (let listener of this.listeners)
        if (listener)
            listener();
}
function resolvePromise(payload) {
    stopListener.call(this);
    return this.resolvers.res(payload);
}
function rejectPromise(error) {
    stopListener.call(this);
    return this.resolvers.rej(error);
}
async function rerun() {
    try {
        this.uploadBatch = firebase_config_1.db().batch();
        this.rollbackBatch = firebase_config_1.db().batch();
        this.uploadRefs = [];
        this.rollbackRefs = [];
        this.writeInfo = {
            batch: this.uploadBatch,
            refs: this.uploadRefs,
        };
        await this.runCallback(this);
        await upload.call(this);
        if (this.rollbacking)
            await rollback.call(this);
        return resolvePromise.call(this);
    }
    catch (e) {
        return rejectPromise.call(this, e);
    }
}
function upload() {
    if (this.uploadRefs.length > 0 && !this.uploadStarted) {
        this.uploadStarted = true;
        return this.uploadBatch.commit();
    }
    return Promise.resolve();
}
async function rollback() {
    try {
        if (this.rollbackRefs.length > 0) {
            this.rollbacking = true;
            await utils_1.promiseWithRetry(this.rollbackBatch.commit(), 'medium');
            this.rollbacking = false;
            if (this.retries < this.maxRetries) {
                this.retries++;
                rerun.call(this);
            }
            else
                throw 'retries exceeded limit';
        }
        else
            throw 'side effect left due to concurrency';
    }
    catch (error) {
        return Promise.reject(`side effect left due to error: ${error}`);
    }
}
function areOwnChanges(uploadRefs, snap) {
    const uploadPaths = uploadRefs.map((ref) => ref.path);
    if (typeof snap.docChanges === 'function') {
        //if query snapshot
        return snap
            .docChanges()
            .every((change) => uploadPaths.includes(change.doc.ref.path));
    }
    else {
        //if document snapshot
        return uploadPaths.includes(snap.ref.path);
    }
}
class QT {
    constructor() {
        this.uploadStarted = false;
        this.snaps = [];
        this.runCallback = null;
        this.rollbacking = false;
        this.retries = 0;
        this.maxRetries = 5;
        this.listeners = [];
        this.resolvers = { res: null, rej: null };
    }
    run(queries = [], runCallback = (t = this) => { }) {
        return new Promise((res, rej) => {
            this.resolvers = { res, rej };
            this.runCallback = runCallback;
            this.snaps = queries.map((q) => null); //initially
            queries.forEach((query) => {
                let index = this.listeners.length;
                const unsub = query.onSnapshot((snap) => {
                    try {
                        this.snaps[index] = snap;
                        if (!this.rollbacking) {
                            if (!this.uploadStarted) {
                                if (this.snaps.every((s) => s !== null)) {
                                    //when every snapshot is fetched atleast once
                                    rerun.call(this);
                                }
                            }
                            else if (!areOwnChanges.call(this, this.uploadRefs, snap)) {
                                this.rollbacking = true;
                            }
                        }
                    }
                    catch (e) {
                        return rejectPromise.call(this, e);
                    }
                });
                this.listeners.push(unsub);
            });
        });
    }
    getLatestSnapshots() {
        return this.snaps;
    }
    set(ref, data, options) {
        this.writeInfo.batch.set(ref, data, options);
        this.writeInfo.refs.push(ref);
    }
    update(ref, data) {
        this.writeInfo.batch.update(ref, data);
        this.writeInfo.refs.push(ref);
    }
    delete(ref) {
        this.writeInfo.batch.delete(ref);
        this.writeInfo.refs.push(ref);
    }
    roll(callback = (t = this) => { }) {
        this.writeInfo = {
            batch: this.rollbackBatch,
            refs: this.rollbackRefs,
        };
        callback(this);
        this.writeInfo = {
            batch: this.uploadBatch,
            refs: this.uploadRefs,
        };
    }
}
exports.default = QT;
