const Game = require("./game");
const game = new Game();
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
  io.sockets.emit("playerPositions", game.getPlayerPositions());

  // disconnection code
  socket.on("disconnect", function () {
    console.log(`${socket.id} has disconnected`);
    game.removePlayer(socket.id);
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
