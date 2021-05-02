//@ts-nocheck
import {
  randomDate,
  randomFloat,
  randomInt,
  randomString,
} from "../utils/utils";

export default function dataGenerator({ type, ...args }) {
  switch (type) {
    case "int":
      return randomInt(+args.min, +args.max);
    case "float":
      return randomFloat(+args.min, +args.max);
    case "date":
      return randomDate(+args.min, +args.max);
    case "string":
      return randomString(+args.len);
    default:
      return null;
  }
}
