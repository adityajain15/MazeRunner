const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
/*function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerWidth;
}
resizeCanvas();*/
const Game = {
  MARGIN: 5,
  CELL_DIMENSION: 30,
  PLAYER_DIMENSION: 15,
  HAS_FINISHED: false
};

const socket = io();
socket.on("connect", () => {
  console.log("Connected to Server");
  socket.on("maze", (maze) => {
    console.log("Recieved maze");
    Game.maze = maze;
    drawMaze(Game.maze);
  });
  socket.on("playerPositions", (playerPositions) => {
    console.log("Recieved player positions");
    Game.playerPositions = playerPositions;
    drawMaze(Game.maze);
  });
  socket.on("announceFinish", ({ winner, solution }) => {
    console.log(`${winner} has won!`);
    Game.SOLUTION = solution;
    drawMaze(Game.maze);
  });
  window.addEventListener("keydown", (event) => {
    if (!Game.playerPositions || !Game.maze || Game.HAS_FINISHED) {
      return;
    }
    const [i, j] = Game.playerPositions[socket.id];
    switch (event.key) {
      case "ArrowDown":
        if (!Game.maze[i][j].walls.DOWN) {
          socket.emit("movePlayer", "DOWN");
        }
        break;
      case "ArrowUp":
        if (!Game.maze[i][j].walls.UP) {
          socket.emit("movePlayer", "UP");
        }
        break;
      case "ArrowLeft":
        if (!Game.maze[i][j].walls.LEFT) {
          socket.emit("movePlayer", "LEFT");
        }
        break;
      case "ArrowRight":
        if (!Game.maze[i][j].walls.RIGHT) {
          socket.emit("movePlayer", "RIGHT");
        }
        break;
    }
  });
});

function drawMaze(maze) {
  canvas.width = maze[0].length * Game.CELL_DIMENSION + 2 * Game.MARGIN;
  canvas.height = maze.length * Game.CELL_DIMENSION + 2 * Game.MARGIN;

  ctx.fillStyle = "lightgray";
  ctx.fillRect(
    (Game.maze[0].length - 1) * Game.CELL_DIMENSION + Game.MARGIN,
    (Game.maze.length - 1) * Game.CELL_DIMENSION + Game.MARGIN,
    Game.CELL_DIMENSION,
    Game.CELL_DIMENSION
  );

  ctx.lineWidth = 1;
  if (Game.SOLUTION) {
    ctx.moveTo(
      Game.MARGIN + Game.CELL_DIMENSION / 2,
      Game.MARGIN + Game.CELL_DIMENSION / 2
    );
    ctx.strokeStyle = "red";
    for (let itr = 0; itr < Game.SOLUTION.length; itr++) {
      const [i, j] = Game.SOLUTION[itr];

      const currentOriginX =
        j * Game.CELL_DIMENSION + Game.CELL_DIMENSION / 2 + Game.MARGIN;
      const currentOriginY =
        i * Game.CELL_DIMENSION + Game.CELL_DIMENSION / 2 + Game.MARGIN;
      ctx.lineTo(currentOriginX, currentOriginY);
    }
    ctx.stroke();
  }

  if (Game.playerPositions) {
    Object.keys(Game.playerPositions).forEach((player) => {
      if (player === socket.id) {
        ctx.fillStyle = "red";
      } else {
        ctx.fillStyle = "blue";
      }
      const [i, j] = Game.playerPositions[player];
      const currentOriginX =
        j * Game.CELL_DIMENSION +
        (Game.CELL_DIMENSION - Game.PLAYER_DIMENSION) / 2 +
        Game.MARGIN;
      const currentOriginY =
        i * Game.CELL_DIMENSION +
        (Game.CELL_DIMENSION - Game.PLAYER_DIMENSION) / 2 +
        Game.MARGIN;
      ctx.fillRect(
        currentOriginX,
        currentOriginY,
        Game.PLAYER_DIMENSION,
        Game.PLAYER_DIMENSION
      );
    });
  }

  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      const currentOriginX = j * Game.CELL_DIMENSION + Game.MARGIN;
      const currentOriginY = i * Game.CELL_DIMENSION + Game.MARGIN;

      ctx.strokeStyle = "black";
      ctx.moveTo(currentOriginX - 0.5, currentOriginY - 0.5);
      if (maze[i][j].walls.UP) {
        ctx.lineTo(
          currentOriginX + Game.CELL_DIMENSION - 0.5,
          currentOriginY - 0.5
        );
      } else {
        ctx.moveTo(
          currentOriginX + Game.CELL_DIMENSION - 0.5,
          currentOriginY - 0.5
        );
      }
      if (maze[i][j].walls.RIGHT) {
        ctx.lineTo(
          currentOriginX + Game.CELL_DIMENSION - 0.5,
          currentOriginY + Game.CELL_DIMENSION - 0.5
        );
      } else {
        ctx.moveTo(
          currentOriginX + Game.CELL_DIMENSION - 0.5,
          currentOriginY + Game.CELL_DIMENSION - 0.5
        );
      }
      if (maze[i][j].walls.DOWN) {
        ctx.lineTo(
          currentOriginX - 0.5,
          currentOriginY + Game.CELL_DIMENSION - 0.5
        );
      } else {
        ctx.moveTo(
          currentOriginX - 0.5,
          currentOriginY + Game.CELL_DIMENSION - 0.5
        );
      }
      if (maze[i][j].walls.LEFT) {
        ctx.lineTo(currentOriginX - 0.5, currentOriginY - 0.5);
      }
    }
  }
  ctx.stroke();
}
