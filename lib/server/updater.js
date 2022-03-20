import chokidar from "chokidar";
import { Server } from "socket.io";

export default (server, publicPath) => {
  const io = new Server(server);

  io.on("connection", socket => {
    console.log("New client connection");
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  chokidar.watch(publicPath, {
    cwd: publicPath, ignoreInitial: true
  }).on("all", (type, path) => {
    if (type.endsWith("Dir")) return;
    if (path.endsWith(".css")) {
      io.emit("cssChange", path);
    } else {
      io.emit("reload");
    }
  });
};
