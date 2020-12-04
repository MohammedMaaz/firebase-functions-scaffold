// @ts-nocheck
const { CloudTasksClient } = require("@google-cloud/tasks");

//to create a new queue enter in cli:
// gcloud tasks queues create my-new-queue

const add = async ({
  queueName,
  endPoint = { isCloudFunction: true, functionName: "", url: null },
  payload,
  runsAt, //milliseconds from epoch
  maxRetries = 5,
}) => {
  const projectId = process.env.project_id;
  const location = "us-central1";
  const queue = queueName;

  const tasksClient = new CloudTasksClient();
  const queuePath = tasksClient.queuePath(projectId, location, queue);

  let url;
  if (endPoint.isCloudFunction)
    url = `https://${location}-${projectId}.cloudfunctions.net/${endPoint.functionName}`;
  else url = endPoint.url;

  const task = {
    httpRequest: {
      httpMethod: "POST",
      url,
      body: Buffer.from(
        JSON.stringify({
          taskPayload: {
            ...payload,
            scheduledAt: runsAt,
            taskCreatedAt: Date.now(),
          },
        })
      ).toString("base64"),
      headers: {
        "Content-Type": "application/json",
      },
    },
    scheduleTime: {
      seconds: runsAt / 1000,
    },
  };

  try {
    const [response] = await tasksClient.createTask(
      { parent: queuePath, task },
      { maxRetries }
    );
    return response.name;
  } catch (e) {
    throw e;
  }
};

const remove = (taskId) =>
  new CloudTasksClient().deleteTask({ name: taskId }, { maxRetries: 5 });

const CloudTask = {
  add,
  remove,
};

export default CloudTask;
