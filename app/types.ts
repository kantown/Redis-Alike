export enum RECOGNIZABLE_COMMANDS {
  ECHO = "ECHO",
  PING = "PING",
  GET = "GET",
  SET = "SET",
  INFO = "INFO",
  QUIT = "QUIT",
}

export const EOL = "\r\n";
export const Null = "$-1";

export interface DatabaseType
  extends Record<string, { value: string; expirationDate: Date }> {}
