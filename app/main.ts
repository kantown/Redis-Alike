import * as net from "net";
import { RespInterpreter } from "./resp_interpreter/resp_interpreter";

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data) => {
    const receivedBuffer = data.toString();
    const requestHandler = new RespInterpreter(connection, receivedBuffer);
    requestHandler.handleRespInput();
  });
});

server.listen(6379, "127.0.0.1");
