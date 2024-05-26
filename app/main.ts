import * as net from "net";

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data) => {
    const receivedBuffer = data.toString().trim();
    if (receivedBuffer === "PING") {
      connection.write("+PONG\r\n");
    }
  });
});

server.listen(6379, "127.0.0.1");
