import { EOL, Null, RECOGNIZABLE_COMMANDS } from "../types";
import { FIRST_BYTES_CODES } from "./types";
import { Socket } from "net";
import { toSimpleError, toSimpleString } from "./helpers";

export class RespInterpreter {
  connection: Socket;
  data: string;
  database: Record<string, string>;

  constructor(
    connection: Socket,
    data: string,
    database: Record<string, string>
  ) {
    this.connection = connection;
    this.data = data;
    this.database = database;
  }

  throwError = (msg?: string) => {
    if (msg) {
      this.connection.write(toSimpleError(msg));

      return;
    }
    this.connection.write(toSimpleError("Unknown error"));
  };

  ping = (splittedBuffer: string[]) => {
    const customPong = splittedBuffer.slice(1).filter(Boolean).join(EOL);

    this.connection.write(
      toSimpleString(!!customPong.trim() ? customPong : `PONG`)
    );
  };

  echo = (splittedBuffer: string[]) => {
    const echoMsg = splittedBuffer.slice(2).filter(Boolean).join(EOL);
    console.log("echoMsg", echoMsg);
    this.connection.write(toSimpleString(echoMsg));
  };

  get = (splittedBuffer: string[]) => {
    const key = splittedBuffer[2]?.toLowerCase() ?? "";

    if (!key) {
      this.throwError("Get is missing Key");
    }

    if (!this.database[key]) {
      this.connection.write(toSimpleString(Null));
    }

    const lookupValue = this.database[key];
    this.connection.write(toSimpleString(lookupValue));
  };

  set = (splittedBuffer: string[]) => {
    const key = splittedBuffer[2];
    const value = splittedBuffer[4];
    if (!key || !value) {
      this.throwError("Set is missing Key");
    }

    this.database[key] = value;

    this.connection.write(toSimpleString("OK"));
  };

  info = () => {
    this.connection.write(toSimpleString("OK"));
  };

  quit = () => {
    this.connection.destroy();
  };

  handleKnownCommands = (splittedBuffer: string[]) => {
    const command = splittedBuffer[0].toLocaleUpperCase();
    console.log("handleKnownCommands splittedBuffer", splittedBuffer);

    switch (command) {
      case RECOGNIZABLE_COMMANDS.ECHO:
        this.echo(splittedBuffer);
        return;
      case RECOGNIZABLE_COMMANDS.PING:
        this.ping(splittedBuffer);
        return;
      case RECOGNIZABLE_COMMANDS.GET:
        this.get(splittedBuffer);
        return;
      case RECOGNIZABLE_COMMANDS.SET:
        this.set(splittedBuffer);
        return;
      case RECOGNIZABLE_COMMANDS.INFO:
        this.info();
        return;
      case RECOGNIZABLE_COMMANDS.QUIT:
        this.quit();
        return;
    }

    this.throwError("Command was not recognized");
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
