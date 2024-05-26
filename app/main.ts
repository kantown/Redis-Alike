import * as net from "net";

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data) => {
    const receivedBuffer = data.toString();
    if (receivedBuffer === "*1\r\n$4\r\nPING\r\n") {
      connection.write("+PONG\r\n");
    }
  });
});

server.listen(6379, "127.0.0.1");
