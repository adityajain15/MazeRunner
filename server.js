const Game = require("./game");
let game = new Game();
let port = process.env.PORT || 8008;
let express = require("express");
let app = express();
let server = require("http")
  .createServer(app)
  .listen(port, function () {
    console.log("Server listening at port: ", port);
  });
// Tell server where to look for files
app.use(express.static("public"));

// Create socket connection
let io = require("socket.io")(server, {
  pingTimeout: 60000,
  path: "/maze/socket.io"
});
io.sockets.on("connection", function (socket) {
  console.log(`${socket.id} has connected`);
  // initial information

  game.addPlayer(socket.id);
  socket.emit("maze", game.getMaze());
  socket.emit("currentHost", game.getHost());
  socket.emit("useVoice", game.getUseVoice());
  io.sockets.emit("playerPositions", game.getPlayerPositions());

  socket.on("hostRestart", ({ height, width, useVoice }) => {
    if (socket.id === game.getHost()) {
      console.log(`recieved reset from host [${height},${width}]`);
      const heightIsValid =
        !Number.isNaN(height) && height >= 5 && height <= 70;
      const widthIsValid = !Number.isNaN(width) && width >= 5 && width <= 70;
      if (heightIsValid && widthIsValid) {
        game.reset(height, width);
      } else {
        game.reset();
      }
      if (game.getUseVoice() !== useVoice) {
        game.setUseVoice(useVoice);
      }
      io.sockets.emit("maze", game.getMaze());
      io.sockets.emit("playerPositions", game.getPlayerPositions());
      io.sockets.emit("hostRestart");
      io.sockets.emit("useVoice", game.getUseVoice());
    }
  });

  // disconnection code
  socket.on("disconnect", function () {
    console.log(`${socket.id} has disconnected`);
    game.removePlayer(socket.id);

    if (!game.hasPlayers()) {
      game = new Game();
      return;
    }

    if (game.getHost() === socket.id) {
      game.changeHost();
      io.sockets.emit("currentHost", game.getHost());
    }
    io.sockets.emit("playerPositions", game.getPlayerPositions());
  });

  // if socket moves
  socket.on("movePlayer", (direction) => {
    if (!game.hasGameFinished() && game.playerCanMove(socket.id, direction)) {
      game.movePlayer(socket.id, direction);
      io.sockets.emit("playerPositions", game.getPlayerPositions());
      if (game.hasGameFinished()) {
        io.sockets.emit("announceFinish", {
          winner: socket.id,
          solution: game.maze.getSolution()
        });
      }
    }
  });
});
