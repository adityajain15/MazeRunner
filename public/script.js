const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
/*function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerWidth;
}
resizeCanvas();*/

const SpeechRecognition = webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;
recognition.interimResults = false;

recognition.onresult = (event) => {
  const speechResult =
    event.results[event.results.length - 1][0].transcript.trim();
  const splitResult = speechResult.split(" ");
  const micResultNode = document.getElementById("mic-result");
  while (micResultNode.firstChild) {
    micResultNode.removeChild(micResultNode.firstChild);
  }
  const commandWordIndex = splitResult.findIndex((word) =>
    ["up", "down", "right", "left"].includes(word)
  );
  splitResult.forEach((word, index) => {
    const el = document.createElement("span");
    el.innerText = `${index === commandWordIndex ? word.toUpperCase() : word}`;
    if (index === commandWordIndex) {
      el.style.textDecoration = "underline";
      el.style.textDecorationColor = "red";
    }
    document.getElementById("mic-result").appendChild(el);
    document.getElementById("mic-result").append(" ");
  });
  if (commandWordIndex < 0) {
    return;
  }
  const commandWord = splitResult[commandWordIndex].toUpperCase();
  const [i, j] = Game.playerPositions[socket.id];
  switch (commandWord) {
    case "DOWN":
      if (!Game.maze[i][j].walls.DOWN) {
        socket.emit("movePlayer", "DOWN");
      }
      break;
    case "UP":
      if (!Game.maze[i][j].walls.UP) {
        socket.emit("movePlayer", "UP");
      }
      break;
    case "LEFT":
      if (!Game.maze[i][j].walls.LEFT) {
        socket.emit("movePlayer", "LEFT");
      }
      break;
    case "RIGHT":
      if (!Game.maze[i][j].walls.RIGHT) {
        socket.emit("movePlayer", "RIGHT");
      }
      break;
  }
};

recognition.onerror = (event) => {
  console.log("something went wrong: " + event.error);
};

const Game = {
  MARGIN: 5,
  CELL_DIMENSION: 20,
  PLAYER_DIMENSION: 10,
  HAS_FINISHED: false,
  useVoice: false
};

function hostRestart() {
  if (socket && socket.connected) {
    const width = document.getElementById("maze-width").value;
    const height = document.getElementById("maze-height").value;
    const useVoice = document.getElementById("radio-use-voice").checked;
    socket.emit("hostRestart", { width, height, useVoice });
  }
}

const socket = io("https://sigri.com", {
  path: "/maze/socket.io/"
});
socket.on("connect", () => {
  console.log("Connected to Server");
  socket.on("currentHost", (host) => {
    Game.HOST = host;
    if (Game.HOST === socket.id) {
      document.getElementById("host-panel").classList.remove("dn");
      document.getElementById("host-panel").classList.add("db");
    } else {
      document.getElementById("host-panel").classList.remove("db");
      document.getElementById("host-panel").classList.add("dn");
    }
  });

  socket.on("hostRestart", () => {
    document.getElementById("announce").style.display = "none";
    Game.SOLUTION = undefined;
    Game.HAS_FINISHED = false;
    drawMaze(Game.maze);
  });

  socket.on("useVoice", (useVoice) => {
    if (Game.voice === useVoice) {
      return;
    }
    Game.useVoice = useVoice;
    if (Game.useVoice) {
      document.getElementById("instructions-arrow-keys").classList.remove("db");
      document.getElementById("instructions-arrow-keys").classList.add("dn");
      document.getElementById("instructions-voice").classList.remove("dn");
      document.getElementById("instructions-voice").classList.add("db");
      document.getElementById("voice-panel").classList.remove("dn");
      document.getElementById("voice-panel").classList.add("db");
    } else {
      document.getElementById("instructions-arrow-keys").classList.remove("dn");
      document.getElementById("instructions-arrow-keys").classList.add("db");
      document.getElementById("instructions-voice").classList.remove("db");
      document.getElementById("instructions-voice").classList.add("dn");
      document.getElementById("voice-panel").classList.remove("db");
      document.getElementById("voice-panel").classList.add("dn");
    }
  });

  socket.on("maze", (maze) => {
    console.log("Recieved maze");
    Game.maze = maze;
    if (!document.getElementById("maze-width").value) {
      document.getElementById("maze-width").value = maze[0].length;
    }
    if (!document.getElementById("maze-height").value) {
      document.getElementById("maze-height").value = maze.length;
    }
    drawMaze(Game.maze);
  });
  socket.on("playerPositions", (playerPositions) => {
    console.log("Recieved player positions");
    Game.playerPositions = playerPositions;
    drawMaze(Game.maze);
  });
  socket.on("announceFinish", ({ winner, solution }) => {
    document.getElementById("announce").style.display = "block";
    document.getElementById("announce-winner").innerText =
      winner === socket.id
        ? `You win!${
            socket.id === Game.HOST
              ? ""
              : " Wait for the host to restart the game"
          }`
        : `You lose.${
            socket.id === Game.HOST
              ? ""
              : " Wait for the host to restart the game"
          }`;
    Game.SOLUTION = solution;
    drawMaze(Game.maze);
  });
  window.addEventListener("keyup", (event) => {
    if (!Game.useVoice) {
      return;
    }

    switch (event.key) {
      case " ":
        event.preventDefault();
        const micIcon = document.getElementById("micon");
        micIcon.style.fill = "black";
        micIcon.style.borderColor = "black";
        document.getElementById("mic-text").innerText =
          "Hold Spacebar and say a direction";
        recognition.stop();
        console.log("Space up");
        break;
    }
  });
  window.addEventListener("keydown", (event) => {
    if (
      event.target.tagName === "INPUT" ||
      !Game.playerPositions ||
      !Game.maze ||
      Game.HAS_FINISHED
    ) {
      return;
    }
    const [i, j] = Game.playerPositions[socket.id];
    if (Game.useVoice) {
      switch (event.key) {
        case " ":
          event.preventDefault();
          if (event.repeat) {
            return;
          }
          const micIcon = document.getElementById("micon");
          micIcon.style.fill = "red";
          micIcon.style.borderColor = "red";
          console.log(document.getElementById("mic-text"));
          document.getElementById("mic-text").innerText =
            "Listening for direction command, release spacebar after you speak";
          document.getElementById("mic-result").innerText = "...";
          recognition.start();
          console.log("Space");
          break;
      }
    } else {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (!Game.maze[i][j].walls.DOWN) {
            socket.emit("movePlayer", "DOWN");
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (!Game.maze[i][j].walls.UP) {
            socket.emit("movePlayer", "UP");
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (!Game.maze[i][j].walls.LEFT) {
            socket.emit("movePlayer", "LEFT");
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (!Game.maze[i][j].walls.RIGHT) {
            socket.emit("movePlayer", "RIGHT");
          }
          break;
      }
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
