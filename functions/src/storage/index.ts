//@ts-nocheck
import { admin, storage, db, refs, functions } from "../utils/firebase_config";
import {
  randHashString,
  fileNameWithoutExtension,
  reduceToArea,
  dynamicImport,
} from "../utils/utils";
import { changeTaskStatus } from "../utils/cf";
const bucket = storage().bucket();

const paramsToUrl = (filePath, token) => {
  const BUCKET_NAME = `${functions.config().project.id}.appspot.com`;
  return (
    "https://firebasestorage.googleapis.com/v0/b/" +
    BUCKET_NAME +
    "/o/" +
    encodeURIComponent(filePath) +
    "?alt=media&token=" +
    token
  );
};

const getDownloadUrl = async (filePath) => {
  try {
    const file = bucket.file(filePath);
    const uuid = randHashString(24);
    await file.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: uuid,
      },
    });
    return paramsToUrl(filePath, uuid);
  } catch (e) {
    throw e;
  }
};

const uploadFile = async (fileLoc, destination) => {
  try {
    const uuid = randHashString(24);
    const data = await bucket.upload(fileLoc, {
      destination,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
    });

    let file = data[0];
    return paramsToUrl(file.name, uuid);
  } catch (error) {
    throw error;
  }
};

/*
  FIXME: security Rule Needed: check that request.auth.uid == metadata.resize.uid
*/
const on_image_upload = async (object) => {
  try {
    //variables
    const sourcePath = object.name;
    const metadata = object.metadata;
    const uploadHook =
      typeof metadata.uploadHook === "string"
        ? JSON.parse(metadata.uploadHook)
        : undefined;
    const variants =
      typeof metadata.resize === "string"
        ? JSON.parse(metadata.resize)
        : undefined;

    //file should be an image
    if (!object.contentType.startsWith("image/")) return;

    //if only upload hook is present then trigger upload hook and return
    if (uploadHook && !variants) {
      const { uid, uploadEventType, eventPayload = null } = uploadHook;
      const url = await getDownloadUrl(sourcePath);
      await changeTaskStatus({
        docRef: refs.users.doc(uid),
        taskId: "on-image-upload",
        status: "triggered",
        payload: {
          imageSchema: { original: url },
          uploadEventType,
          eventPayload,
        },
      });
      return;
    }

    if (!variants) return;

    //lazily loading required modules
    const [path, os, fs, sharp] = await dynamicImport(
      "path",
      "os",
      "fs-extra",
      "sharp"
    );

    //constants
    const sourceName = path.basename(sourcePath);
    const bucketDir = path.dirname(sourcePath);

    //making directory and paths in temp
    const workingDir = path.join(os.tmpdir(), `variants${Date.now()}`);
    const tempFilePath = path.join(workingDir, sourceName);
    await fs.ensureDir(workingDir);

    //download the source file.
    await bucket.file(sourcePath).download({
      destination: tempFilePath,
    });

    //getting source file width and heigth through sharp
    const source = sharp(tempFilePath);
    const { width, height } = await source.metadata();
    const variantsArray = Object.keys(variants);
    let uploadPromises = [];

    //iterating on variants
    for (let variant in variants) {
      //if given variant is already greater in size than the original file, then no need to resize it
      if (variants[variant] >= width * height) {
        uploadPromises.push(getDownloadUrl(sourcePath));
        continue;
      }

      let VariantName = `${fileNameWithoutExtension(sourceName)}@${variant}_${
        variants[variant]
      }${path.extname(sourceName)}`;
      let variantPath = path.join(workingDir, VariantName);

      const area = variants[variant];
      let toDim = reduceToArea({ width, height, area });

      //resizing image
      await sharp(tempFilePath)
        .resize(toDim.width, toDim.height)
        .toFile(variantPath);

      //pushing upload in promises array
      uploadPromises.push(
        uploadFile(variantPath, bucketDir + "/" + VariantName)
      );
    }
    //simultaneously uploading variants to storage
    let urls = await Promise.all(uploadPromises);
    let imageSchema = {};

    urls.forEach((url, index) => {
      imageSchema[variantsArray[index]] = url;
    });

    //if uploadHook is present on a resize intent
    if (uploadHook) {
      const { uid, uploadEventType, eventPayload = null } = uploadHook;
      await changeTaskStatus({
        docRef: refs.users.doc(uid),
        taskId: "on-image-upload",
        status: "triggered",
        payload: {
          imageSchema,
          uploadEventType,
          eventPayload,
        },
      });
    }

    //removing the temp files
    await fs.remove(workingDir);
  } catch (error) {
    throw error;
  }
};

const Storage = {
  on_image_upload,
};

export default Storage;
