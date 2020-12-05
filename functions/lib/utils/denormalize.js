"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDenormalized = void 0;
//@ts-nocheck
const cf_1 = require("./cf");
const firebase_config_1 = require("./firebase_config");
//sample payload object
// const payload = {
//   updates: [
//     {
//       collectionGroup: false,
//       parentDocPath: null, //or a doc path
//       collectionName: 'orders',
//       queryCritereas: [
//         {
//           fieldPath: 'driverDetails.displayName',
//           operator: '==',
//           value: 'Old Name',
//         },
//       ],
//       newValue: 'New Name',
//       oldValue: 'Old Name',
//       fieldPath: 'driverDetails.displayName',
//     },
//   ],
// };
exports.updateDenormalized = cf_1.withRetryEnabled(cf_1.withTriggerTask(async (config, change, context) => {
    const taskId = change.after.id;
    const { updates } = change.after.data().payload;
    const queries = [];
    const batchGetSize = Math.floor(500 / updates.length) - 1;
    //prepare queries
    for (let update of updates) {
        let query;
        const { collectionName, parentDocPath, collectionGroup, oldValue, newValue, fieldPath, } = update;
        if (collectionGroup)
            query = firebase_config_1.db().collectionGroup(collectionName);
        else if (parentDocPath)
            query = firebase_config_1.db().doc(parentDocPath).collection(collectionName);
        else
            query = firebase_config_1.db().collection(collectionName);
        if (oldValue)
            query = query.where(fieldPath, '==', oldValue); //very important step otherwise recursion may get infinite
        for (let { fieldPath, operator, value } of update.queryCritereas)
            query = query.where(fieldPath, operator, value);
        //precautionary check
        if (oldValue === newValue)
            queries.push({ get: async () => [] });
        else
            queries.push(query.limit(batchGetSize));
    }
    //fetch docs to be updated
    const snaps = await Promise.all(queries.map((q) => q.get().catch((e) => [])));
    //prepare new updates if any
    const newUpdates = [];
    snaps.forEach((snap, i) => {
        //if more docs are there or an error occurred during fetching then pass them for next recursion
        if (snap.size === batchGetSize || snap.length === 0)
            newUpdates.push(updates[i]);
    });
    //update docs acc. to the new value
    const batch = firebase_config_1.db().batch();
    snaps.forEach((snap, i) => {
        snap.forEach((doc) => {
            batch.update(doc.ref, {
                [updates[i].fieldPath]: updates[i].newValue,
            });
        });
    });
    //trigger next batch of the task if required
    if (newUpdates.length > 0)
        await cf_1.changeTaskStatus({
            docRef: change.after.ref.parent.parent,
            taskId,
            status: 'triggered',
            payload: { updates: newUpdates },
            batch,
        });
    //commit changes (if error occures here, next batch won't get triggered instead this task will get retried which is more natural)
    await batch.commit();
}));
