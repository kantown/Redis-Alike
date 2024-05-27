import * as net from "net";
import { RespInterpreter } from "./resp_interpreter/resp_interpreter";
import { DatabaseType } from "./types";
import { argv } from "node:process";
import { toBulkString, toMapString } from "./resp_interpreter/helpers";

const REPLICATION_ID = "8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb";

const database: DatabaseType = {};

const PORT = !!argv[2] ? Number(argv[2] ?? 6379) : 6379;
const REPLICA_OF = !!argv[3] ? argv[3] : "";

const [masterAddress, masterPort] = REPLICA_OF.split(" ");

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
    console.log(address, port, role);

    const requestHandler = new RespInterpreter(
      connection,
      database,
      role,
      isReplica ? REPLICATION_ID : "0",
      "0"
    );

    connection.on("data", (data) => {
      const receivedBuffer = data.toString();
      requestHandler.handleRespInput(receivedBuffer);
    });
  });

  if (isReplica) {
    const connectionToMaster = net.connect({
      path: masterAddress,
      port: Number(masterPort),
    });
    const ping = toBulkString("PING");
    console.log(toMapString([ping]));
    connectionToMaster.write(toMapString([ping]));
  }

  server.listen(port, address);
};

if (!!REPLICA_OF) {
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
