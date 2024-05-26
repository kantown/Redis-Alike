import * as net from "net";
import { RespInterpreter } from "./resp_interpreter/resp_interpreter";
import { DatabaseType } from "./types";
import { argv } from "node:process";

const database: DatabaseType = {};

const PORT = argv[2] === "--port" ? Number(argv[3] ?? 6379) : 6379;

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data) => {
    const receivedBuffer = data.toString();

    const requestHandler = new RespInterpreter(
      connection,
      receivedBuffer,
      database
    );
    requestHandler.handleRespInput();
  });
});

server.listen(PORT, "127.0.0.1");
