//@ts-nocheck
import CloudTask from "../cloudTask";
import { withHTTPS } from "../utils/cf";
import { functions, refs, serverTimestamp } from "../utils/firebase_config";
import { delay } from "../utils/utils";

async function toTest(config) {
  console.log("hello");
  await delay(2000);
  console.log(config.https.headers.host);
}

async function cloudTaskTest() {
  await CloudTask.add({
    queueName: "test-queue",
    endPoint: {
      url:
        "https://us-central1-mandi-express.cloudfunctions.net/CTRedirectTest",
    },
    httpMethod: "POST",
    body: {
      user: "URENVRZNG",
      channel: "URENVRZNG",
      text: "Hi from cloud task!",
    },
    headers: {
      Authorization: `Bearer ${functions.config().https.api_key}`,
      "x-gcp-functions-api-key": "506f288e-7c4c-4f51-98ab-4e91773642af",
    },
    runsAt: Date.now() + 8000, //8 secs from now
  });
}

const testFunction = withHTTPS(async function (...args) {
  const response = await cloudTaskTest(...args);
  return response;
}, {});

export default testFunction;
