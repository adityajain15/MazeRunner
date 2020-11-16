const Maze = require("./maze");
class Game {
  constructor() {
    this.maze = new Maze(10, 10);
    this.players = {};
    this.gameFinished = false;
  }
  addPlayer(id) {
    this.players[id] = [0, 0];
  }

  removePlayer(id) {
    delete this.players[id];
  }

  getMaze() {
    return this.maze.getMaze();
  }

  getPlayerPositions() {
    return this.players;
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
