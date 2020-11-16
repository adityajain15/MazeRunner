const Maze = require("./maze");
class Game {
  constructor() {
    this.maze = new Maze(10, 10);
    this.players = {};
    this.host = null;
    this.gameFinished = false;
  }
  addPlayer(id) {
    if (!this.host) {
      this.host = id;
    }
    this.players[id] = [0, 0];
  }

  removePlayer(id) {
    delete this.players[id];
  }

  changeHost() {
    const otherPlayers = Object.keys(this.players);
    if (otherPlayers.length) {
      this.host = otherPlayers[0];
    } else {
      this.host = null;
    }
  }

  getHost() {
    return this.host;
  }

  reset(height = 10, width = 10) {
    this.maze = new Maze(height, width);
    Object.keys(this.players).forEach((player) => {
      this.players[player] = [0, 0];
    });
    this.gameFinished = false;
  }

  hasPlayers() {
    return Object.keys(this.players).length > 0;
  }

  getMaze() {
    return this.maze.getMaze();
  }

  getPlayerPositions() {
    return this.players;
  }

  playerCanMove(id, KEY) {
    const [i, j] = this.players[id];
    const presentCell = this.maze.getCell(i, j);
    if (
      (KEY === "DOWN" && !presentCell.walls.DOWN) ||
      (KEY === "UP" && !presentCell.walls.UP) ||
      (KEY === "LEFT" && !presentCell.walls.LEFT) ||
      (KEY === "RIGHT" && !presentCell.walls.RIGHT)
    ) {
      return true;
    }
    return false;
  }

  movePlayer(id, KEY) {
    const [i, j] = this.players[id];
    if (KEY === "DOWN") {
      this.players[id] = [i + 1, j];
    } else if (KEY === "UP") {
      this.players[id] = [i - 1, j];
    } else if (KEY === "RIGHT") {
      this.players[id] = [i, j + 1];
    } else if (KEY === "LEFT") {
      this.players[id] = [i, j - 1];
    } else {
      throw Error("UNRECOGNIZED KEY");
    }
    const [player_i, player_j] = this.players[id];
    const [finish_i, finish_j] = this.maze.getGoal();
    if (player_i === finish_i && player_j === finish_j) {
      this.gameFinished = true;
    }
  }

  hasGameFinished() {
    return this.gameFinished;
  }
}
module.exports = Game;
