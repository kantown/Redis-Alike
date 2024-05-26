import { EOL } from "os";
import { FIRST_BYTES_CODES } from "./types";

export const toSimpleString = (message: string) => {
  return `${FIRST_BYTES_CODES.SIMPLE_STRING}${message}`;
};

export const toSimpleError = (message: string) => {
  return `${FIRST_BYTES_CODES.SIMPLE_STRING}${message}`;
};
