const requireIfExists = (path, defaultVal = null) => {
  try {
    return require(path);
  } catch (e) {
    if (e instanceof Error && e.code === "MODULE_NOT_FOUND") return defaultVal;
    throw e;
  }
};

module.exports = {
  requireIfExists,
};
