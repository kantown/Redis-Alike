import { DatabaseType, EOL, Null, RECOGNIZABLE_COMMANDS } from "../types";
import { FIRST_BYTES_CODES } from "./types";
import { Socket } from "net";
import { toSimpleError, toSimpleString } from "./helpers";

export class RespInterpreter {
  connection: Socket;
  data: string;
  database: DatabaseType;

  constructor(connection: Socket, data: string, database: DatabaseType) {
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

    const foundItem = this.database[key];
    const time = String(new Date().getTime());
    if (foundItem?.expirationDate > time) {
      delete this.database[key];
      this.connection.write(toSimpleString(Null));
      return;
    }

    this.connection.write(toSimpleString(foundItem.value));
  };

  set = (splittedBuffer: string[]) => {
    const key = splittedBuffer[2];
    const value = splittedBuffer[4];
    const px = splittedBuffer[6];
    const expirationInMs = splittedBuffer[8];

    if (!key || !value) {
      this.throwError("Set is missing Key or Value");
    }

    this.database[key].value = value;

    if (px && expirationInMs) {
      const now = String(new Date().getTime());
      this.database[key].expirationDate = now;
    }

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

    this.handleKnownCommands(restOfCommand);
  };

  handleRespInput = () => {
    if (!this.data) {
      return;
    }
    const splittedData = this.data.split(EOL);
    const firstByte = splittedData[0][0] as unknown as FIRST_BYTES_CODES;

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
