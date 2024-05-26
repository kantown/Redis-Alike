import { EOL, RECOGNIZABLE_COMMANDS } from "../types";
import { FIRST_BYTES_CODES } from "./types";
import { Socket } from "net";
import { toSimpleString } from "./helpers";

const ping = (connection: Socket, splittedBuffer: string[]) => {
  const customPong = splittedBuffer[2].trim();

  connection.write(toSimpleString(!!customPong ? customPong : "PONG"));
};

const echo = (connection: Socket, splittedBuffer: string[]) => {
  const echoMsg = splittedBuffer.slice(2).join(EOL);
  console.log("echoMsg", echoMsg);
  connection.write(toSimpleString(echoMsg));
};

const handleKnownCommands = (connection: Socket, splittedBuffer: string[]) => {
  const command = splittedBuffer[0].toLocaleUpperCase();
  console.log("handleKnownCommands splittedBuffer", splittedBuffer);

  switch (command) {
    case RECOGNIZABLE_COMMANDS.ECHO:
      echo(connection, splittedBuffer);
      break;
    case RECOGNIZABLE_COMMANDS.PING:
      ping(connection, splittedBuffer);
      break;
  }
};

const handleBulkString = (connection: Socket, splittedBuffer: string[]) => {
  const bufferWithoutLength = splittedBuffer.slice(1);
  handleKnownCommands(connection, bufferWithoutLength);
};

const handleComplexArrayInput = (
  connection: Socket,
  splittedBuffer: string[]
) => {
  const [encodedLength, ...restOfCommand] = splittedBuffer.slice(1);
  console.log("restOfCommand", restOfCommand);

  handleKnownCommands(connection, restOfCommand);
};

export const handleRespInput = (connection: Socket, data: string) => {
  if (!data) {
    return;
  }
  const splittedData = data.split(EOL);
  const firstByte = splittedData[0][0] as unknown as FIRST_BYTES_CODES;
  console.log("splittedData", splittedData);

  switch (firstByte) {
    case FIRST_BYTES_CODES.BULK_STRING:
      handleBulkString(connection, splittedData);
      break;
    case FIRST_BYTES_CODES.ARRAY:
      handleComplexArrayInput(connection, splittedData);
      break;
  }
};
