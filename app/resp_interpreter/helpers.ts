import { EOL } from "../types";
import { FIRST_BYTES_CODES } from "./types";

export const toSimpleString = (message: string) => {
  return `${FIRST_BYTES_CODES.SIMPLE_STRING}${message}${EOL}`;
};

export const toSimpleError = (message: string) => {
  return `${FIRST_BYTES_CODES.SIMPLE_ERROR}${message}${EOL}`;
};
