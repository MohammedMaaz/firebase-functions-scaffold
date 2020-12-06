//@ts-nocheck

import GlobalConfig from "../globalConfig";
import { withHTTPS } from "../utils/cf";

const set_global_config = withHTTPS(async () => {
  await GlobalConfig.set_default();
  return "global config set to default successfully!";
}, {});

const Script = {
  set_global_config,
};

export default Script;
