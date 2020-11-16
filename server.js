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
  pingTimeout: 60000
});
io.sockets.on("connection", function (socket) {
  console.log(`${socket.id} has connected`);
  // initial information
  socket.emit("maze", game.getMaze());
  game.addPlayer(socket.id);
  socket.emit("currentHost", game.getHost());
  io.sockets.emit("playerPositions", game.getPlayerPositions());

  socket.on("hostRestart", ({ height, width }) => {
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
      io.sockets.emit("maze", game.getMaze());
      io.sockets.emit("playerPositions", game.getPlayerPositions());
      io.sockets.emit("hostRestart");
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
    if (!game.hasGameFinished()) {
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
