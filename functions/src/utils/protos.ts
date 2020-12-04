//@ts-nocheck
import { serverTimestamp, currUser } from "./firebase_config";

const metadata = {
  created: (at = serverTimestamp(), by = currUser().uid) => ({
    createdAt: at,
    createdBy: by,
  }),
  updated: (at = serverTimestamp(), by = currUser().uid) => ({
    updatedAt: at,
    updatedBy: by,
  }),
};

const eventLog = ({
  logType,
  metadata = null,
  timestamp = serverTimestamp(),
}) => {
  return { logType, metadata, timestamp };
};

const image = ({ thumbnail = null, medium = null, large = null }) => ({
  thumbnail,
  medium,
  large,
});

const location = ({ address, city, lat, lng }) => ({
  address,
  city,
  lat,
  lng,
});

const ratingDetails = ({ averageRating = 0, totalRatings = 0 }) => ({
  averageRating,
  totalRatings,
});

const status = ({
  value,
  description = null,
  timestamp = serverTimestamp(),
}) => ({
  value,
  description,
  timestamp,
});

const task = ({ taskId, runsAt, hasExecuted = false }) => ({
  taskId,
  runsAt: runsAt instanceof Date ? runsAt : new Date(runsAt),
  hasExecuted,
});

const Protos = {
  metadata,
  image,
  location,
  ratingDetails,
  status,
  task,
  eventLog,
};

export default Protos;
