//@ts-nocheck

import Firestore from "../firestore";
import GlobalConfig from "../globalConfig";
import dataGenerator from "../utils/dataGenerator";
import { db, refs } from "../utils/firebase_config";
import { PromiseAll } from "../utils/utils";

async function set_global_config() {
  await GlobalConfig.set_default();
  return "global config set to default successfully!";
}

async function set_field_in_collection(
  collectionPath,
  field,
  valueConfig,
  allowOverWrites = true,
  allowFieldCreation = true
) {
  if (typeof field !== "string" || !field)
    throw "Invalid value of field. Requires a non-empty string";

  let { docs } = await (allowFieldCreation
    ? Firestore.get_list(db().collection(collectionPath))
    : Firestore.get_list(db().collection(collectionPath).orderBy(field)));

  if (!allowOverWrites)
    docs = docs.filter((doc) => !Object(doc).hasOwnProperty(field));

  await PromiseAll(
    docs.map((doc) =>
      doc._original.ref.update({
        [field]: Object(valueConfig).hasOwnProperty("type")
          ? dataGenerator(valueConfig)
          : valueConfig,
      })
    )
  );
}

async function replace_field_in_collection(collectionPath, oldField, newField) {
  if (typeof oldField !== "string" || !oldField)
    throw "Invalid value of oldField. Requires a non-empty string";
  if (typeof newField !== "string" || !newField)
    throw "Invalid value of newField. Requires a non-empty string";

  const { docs } = await Firestore.get_list(
    db().collection(collectionPath).orderBy(oldField)
  );

  await PromiseAll(
    docs.map((doc) => {
      let value = doc[oldField];
      return doc._original.ref.update({
        [oldField]: db.FieldValue.delete(),
        [newField]: value,
      });
    })
  );
}

async function delete_field_in_collection(collectionPath, field) {
  if (typeof field !== "string" || !field)
    throw "Invalid value of field. Requires a non-empty string";

  const { docs } = await Firestore.get_list(
    db().collection(collectionPath).orderBy(field)
  );

  await PromiseAll(
    docs.map((doc) => {
      return doc._original.ref.update({
        [field]: db.FieldValue.delete(),
      });
    })
  );
}

async function hello_world(...args) {
  console.log(args);
  return "Hello World!";
}

export default {
  set_field_in_collection,
  replace_field_in_collection,
  delete_field_in_collection,
  hello_world,
};
