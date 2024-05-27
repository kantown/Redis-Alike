import * as net from "net";
import { RespInterpreter } from "./resp_interpreter/resp_interpreter";
import { DatabaseType } from "./types";
import { argv } from "node:process";

const REPLICATION_ID = "8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb";

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
  const isReplica = role === "slave";
  const server: net.Server = net.createServer((connection: net.Socket) => {
    const requestHandler = new RespInterpreter(
      connection,
      database,
      role,
      isReplica ? "0" : REPLICATION_ID,
      "0"
    );

    connection.on("data", (data) => {
      const receivedBuffer = data.toString();
      requestHandler.handleRespInput(receivedBuffer);
    });

    connection.on("ready", () => {
      if (isReplica) {
        requestHandler.startHandShake();
      }
    });
  });

  server.listen(port, address);
};

if (!!replicaAddress && !!replicaPort) {
  runNewServer({
    port: PORT,
    role: "slave",
  });
} else {
  runNewServer({
    port: PORT,
    role: "master",
  });
}
