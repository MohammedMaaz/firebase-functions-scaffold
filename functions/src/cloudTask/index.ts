// @ts-nocheck
import { functions } from "../utils/firebase_config";
import { jsonToQueryString } from "../utils/utils";
const { CloudTasksClient } = require("@google-cloud/tasks");

//to create a new queue enter in cli:
// gcloud tasks queues create my-new-queue

let tasksClient;
function get_client() {
  if (!tasksClient) tasksClient = new CloudTasksClient();
  return tasksClient;
}

const create_queue = async (name) => {
  const client = get_client();
  const projectId = functions.config().project.id;
  const region = functions.config().project.region;

  const [response] = await client.createQueue({
    parent: client.locationPath(projectId, region),
    queue: {
      name: client.queuePath(projectId, region, name),
      appEngineHttpQueue: {
        appEngineRoutingOverride: {
          service: "default",
        },
      },
    },
  });
};

const add = async ({
  queueName,
  endPoint = { isCloudFunction: true, functionName: "", url: null },
  payload = {},
  queryParams,
  runsAt, //milliseconds from epoch or Date Object
  maxRetries = 5,
  httpMethod = "POST",
  headers = {},
  createQueueIfNotExists = true,
  createQueueRetries = 5,
}) => {
  const projectId = functions.config().project.id;
  const location = functions.config().project.region;
  const queue = queueName;

  const client = get_client();
  const queuePath = client.queuePath(projectId, location, queue);

  let url;
  if (endPoint.isCloudFunction)
    url = `https://${location}-${projectId}.cloudfunctions.net/${endPoint.functionName}`;
  else url = endPoint.url;

  const task = {
    httpRequest: {
      httpMethod,
      url: url + jsonToQueryString(queryParams),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    },
    scheduleTime: {
      seconds: runsAt / 1000,
    },
  };

  if (httpMethod === "POST")
    task.body = Buffer.from(
      JSON.stringify({
        taskPayload: {
          meta_scheduled_at: runsAt,
          meta_task_created_at: Date.now(),
          ...payload,
        },
      })
    ).toString("base64");

  try {
    const [response] = await client.createTask(
      { parent: queuePath, task },
      { maxRetries }
    );
    return response.name;
  } catch (e) {
    if (e.code === 13 && createQueueIfNotExists && createQueueRetries > 0) {
      await create_queue(queueName);
      await add({
        queueName,
        endPoint,
        payload,
        queryParams,
        runsAt,
        maxRetries,
        httpMethod,
        headers,
        createQueueIfNotExists,
        createQueueRetries: createQueueRetries - 1,
      });
    } else throw e;
  }
};

const remove = (taskId) =>
  get_client().deleteTask({ name: taskId }, { maxRetries: 5 });

const CloudTask = {
  add,
  remove,
  create_queue,
  get_client,
};

export default CloudTask;
