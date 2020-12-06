// @ts-nocheck
import { db, refs } from "../utils/firebase_config";
import Firestore from "../firestore";
import { globalConfigJSON } from "./globalConfig";
import { withHTTPS } from "../utils/cf";

const seperatorIndex = (string, opts) => {
  for (let i = 0; i < string.length; ++i) {
    if (opts.includes(string[i])) return i;
  }
  return -1;
};

const get = async (id, t) => {
  const ref = refs.config.doc(id);
  let config = {};
  const obj = await Firestore.get(ref, t);
  for (let key in obj) {
    if (key !== "id" && key !== "_original") config[key] = obj[key].value;
  }
  return config;
};

const get_value = (id, key, fallback, t) => {
  const ref = refs.config.doc(id);
  let seperator = seperatorIndex(key, ["[", "."]);
  let start = key;
  let stop = "";

  if (seperator !== -1) {
    start = key.slice(0, seperator - 1);
    stop = key.slice(seperator);
  }
  return Firestore.get_value(ref, `${start}.value${stop}`, fallback, t);
};

const set_default = async () => {
  const gc = globalConfigJSON;
  const batch = db().batch();
  for (let doc of gc)
    batch.set(refs.config.doc(doc.id), doc.data, { merge: true });
  await batch.commit();
};

let GlobalConfig = {
  get,
  get_value,
  set_default,
};

export default GlobalConfig;
