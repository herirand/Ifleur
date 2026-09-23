import { ConfigResponse } from "./config.dto";
import config from '../../config/config.json'

export function getConfig(): ConfigResponse {
  return config as ConfigResponse;
}
