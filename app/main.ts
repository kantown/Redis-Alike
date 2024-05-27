import * as net from "net";
import { RespInterpreter } from "./resp_interpreter/resp_interpreter";
import { DatabaseType } from "./types";
import { argv } from "node:process";

const database: DatabaseType = {};

const PORT = argv[2] === "--port" ? Number(argv[3] ?? 6379) : 6379;
const REPLICA_OF = argv[4] === "--replicaof" ? argv[5] : "";

const [replicaAddress, replicaPort] = REPLICA_OF.split(" ");

const runNewServer = ({
  address = "127.0.0.1",
  port,
  role = "slave",
}: {
  address?: string;
  port: number;
  role?: "master" | "slave";
}) => {
  const server: net.Server = net.createServer((connection: net.Socket) => {
    // Handle connection
    connection.on("data", (data) => {
      const receivedBuffer = data.toString();

      const requestHandler = new RespInterpreter(
        connection,
        receivedBuffer,
        database,
        role
      );
      requestHandler.handleRespInput();
    });
  });

  server.listen(port, address);
};

runNewServer({ port: PORT, role: "master" });

if (!!replicaAddress && !!replicaPort) {
  runNewServer({
    address: replicaAddress === "localhost" ? "127.0.0.1" : replicaAddress,
    port: Number(replicaPort),
    role: "slave",
  });
}
