import { DatabaseType, EOL, Null, RECOGNIZABLE_COMMANDS } from "../types";
import { FIRST_BYTES_CODES } from "./types";
import { Socket } from "net";
import {
  toBulkString,
  toMapString,
  toSimpleError,
  toSimpleString,
} from "./helpers";

export class RespInterpreter {
  connection: Socket;
  database: DatabaseType;
  information: Record<string, string>;

  constructor(
    connection: Socket,
    database: DatabaseType,
    role: "master" | "slave",
    masterReplId: string,
    masterReplOffset: string
  ) {
    this.connection = connection;
    this.database = database;
    this.information = {
      role,
      master_replid: masterReplId,
      master_repl_offset: masterReplOffset,
    };
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
      this.connection.write(Null);
    }

    const foundItem = this.database[key];
    const time = String(new Date().getTime());

    if (
      foundItem?.expirationDate &&
      Number(foundItem.expirationDate) < Number(time)
    ) {
      delete this.database[key];
      this.connection.write(Null);
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
      return;
    }

    this.database[key] = { value };

    if (px && expirationInMs) {
      const now = String(new Date().getTime() + Number(expirationInMs));
      this.database[key].expirationDate = now;
    }

    this.connection.write(toSimpleString("OK"));
  };

  info = () => {
    const mappedInfo = Object.entries(this.information).map(
      ([key, value]) => `${key}:${value}`
    );
    this.connection.write(toBulkString(mappedInfo.join("")));
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

  handleRespInput = (data: string) => {
    if (!data) {
      return;
    }
    const splittedData = data.split(EOL);
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

  startHandShake = () => {
    const ping = toBulkString("PING");
    console.log(toMapString([ping]));
    this.connection.write(toMapString([ping]));
  };
}
