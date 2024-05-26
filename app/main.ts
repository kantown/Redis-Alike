import * as net from "net";
import { handleRespInput } from "./resp_interpreter/resp_interpreter";

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data) => {
    const receivedBuffer = data.toString();
    console.log(String.raw({ raw: receivedBuffer.split("") }));
    handleRespInput(connection, receivedBuffer);
  });
});

server.listen(6379, "127.0.0.1");
