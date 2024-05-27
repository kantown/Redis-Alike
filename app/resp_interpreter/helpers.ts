import { EOL } from "../types";
import { FIRST_BYTES_CODES } from "./types";

export const toSimpleString = (message: string) => {
  return `${FIRST_BYTES_CODES.SIMPLE_STRING}${message}${EOL}`;
};

export const toSimpleError = (message: string) => {
  return `${FIRST_BYTES_CODES.SIMPLE_ERROR}${message}${EOL}`;
};

export const toBulkString = (message: string) => {
  return `${FIRST_BYTES_CODES.BULK_STRING}${message.length}${EOL}${message}${EOL}`;
};

export const toMapString = (array: string[]) => {
  return `*${array.length}${array.join("")}`;
};
