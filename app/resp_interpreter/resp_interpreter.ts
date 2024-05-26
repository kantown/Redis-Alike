import { EOL, RECOGNIZABLE_COMMANDS } from "../types";
import { FIRST_BYTES_CODES } from "./types";
import { Socket } from "net";
import { toSimpleString } from "./helpers";

export class RespInterpreter {
  connection: Socket;
  data: string;
  constructor(connection: Socket, data: string) {
    this.connection = connection;
    this.data = data;
  }

  ping = (splittedBuffer: string[]) => {
    const customPong = splittedBuffer.slice(1).map(Boolean).join(EOL);

    this.connection.write(
      toSimpleString(!!customPong.trim() ? customPong : `PONG`)
    );
  };

  echo = (splittedBuffer: string[]) => {
    const echoMsg = splittedBuffer.slice(2).map(Boolean).join(EOL);
    console.log("echoMsg", echoMsg);
    this.connection.write(toSimpleString(echoMsg));
  };

  handleKnownCommands = (splittedBuffer: string[]) => {
    const command = splittedBuffer[0].toLocaleUpperCase();
    console.log("handleKnownCommands splittedBuffer", splittedBuffer);

    switch (command) {
      case RECOGNIZABLE_COMMANDS.ECHO:
        this.echo(splittedBuffer);
        break;
      case RECOGNIZABLE_COMMANDS.PING:
        this.ping(splittedBuffer);
        break;
    }
  };

  handleBulkString = (splittedBuffer: string[]) => {
    const bufferWithoutLength = splittedBuffer.slice(1);
    this.handleKnownCommands(bufferWithoutLength);
  };

  handleComplexArrayInput = (splittedBuffer: string[]) => {
    const [encodedLength, ...restOfCommand] = splittedBuffer.slice(1);
    console.log("restOfCommand", restOfCommand);

    this.handleKnownCommands(restOfCommand);
  };

  handleRespInput = () => {
    if (!this.data) {
      return;
    }
    const splittedData = this.data.split(EOL);
    const firstByte = splittedData[0][0] as unknown as FIRST_BYTES_CODES;
    console.log("splittedData", splittedData);

    switch (firstByte) {
      case FIRST_BYTES_CODES.BULK_STRING:
        this.handleBulkString(splittedData);
        break;
      case FIRST_BYTES_CODES.ARRAY:
        this.handleComplexArrayInput(splittedData);
        break;
    }
  };
}
