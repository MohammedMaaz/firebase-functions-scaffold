//@ts-nocheck
import CloudTask from "../cloudTask";
import { withHTTPS } from "../utils/cf";
import { functions } from "../utils/firebase_config";
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
      url: "https://slack.com/api/chat.postMessage",
    },
    httpMethod: "POST",
    body: {
      user: "URENVRZNG",
      channel: "URENVRZNG",
      text: "Hi from cloud task!",
    },
    headers: {
      Authorization: `Bearer ${functions.config().slack.bot_token}`,
    },
    runsAt: Date.now() + 10000, //10 secs from now
  });
}

const testFunction = withHTTPS(async function (config) {
  await cloudTaskTest(config);
}, {});

export default testFunction;
