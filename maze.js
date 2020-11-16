class Maze {
  constructor(height, width) {
    this.height = height;
    this.width = width;
    this.goal = [height - 1, width - 1];
    const [maze, solution] = this.createMaze(height, width);
    this.maze = maze;
    this.solution = solution;
    for (let i = 0; i < this.maze.length; i++) {
      for (let j = 0; j < this.maze[i].length; j++) {
        this.maze[i][j].deleteVisited();
      }
    }
  }

  createMaze(height, width) {
    const maze = [];
    const solution = [];
    let solutionComplete = false;
    for (let i = 0; i < height; i++) {
      maze.push([]);
      for (let j = 0; j < width; j++) {
        maze[i].push(new Cell());
      }
    }
    const DFS = [[0, 0]];
    maze[0][0].setVisited();
    solution.push([0, 0]);
    while (DFS.length) {
      const [curr_i, curr_j] = DFS.pop();
      if (curr_i === height - 1 && curr_j === width - 1) {
        solution.push([curr_i, curr_j]);
        solutionComplete = true;
      }
      if (this.hasUnvisitedNeighbor(maze, [curr_i, curr_j])) {
        DFS.push([curr_i, curr_j]);
        const [
          neighbor_i,
          neighbor_j,
          current_wall,
          neighbor_wall
        ] = this.getUnvisitedNeighbor(maze, [curr_i, curr_j]);
        if (!solutionComplete) {
          solution.push([neighbor_i, neighbor_j]);
        }
        maze[curr_i][curr_j].walls[current_wall] = false;
        maze[neighbor_i][neighbor_j].walls[neighbor_wall] = false;
        maze[neighbor_i][neighbor_j].setVisited();
        DFS.push([neighbor_i, neighbor_j]);
      } else if (!solutionComplete) {
        solution.pop();
      }
    }
    return [maze, solution];
  }

  getMaze() {
    return this.maze;
  }

  getSolution() {
    return this.solution;
  }

  getCell(i, j) {
    return this.maze[i][j];
  }

  getGoal() {
    return this.goal;
  }

  getUnvisitedNeighbor(maze, [curr_i, curr_j]) {
    const unvisitedNeighbors = [];
    [
      [curr_i, curr_j - 1, "LEFT", "RIGHT"],
      [curr_i, curr_j + 1, "RIGHT", "LEFT"],
      [curr_i - 1, curr_j, "UP", "DOWN"],
      [curr_i + 1, curr_j, "DOWN", "UP"]
    ].forEach(([i, j, curr_wall, neigh_wall]) => {
      if (maze[i] && maze[i][j] && maze[i][j].hasNotBeenVisited()) {
        unvisitedNeighbors.push([i, j, curr_wall, neigh_wall]);
      }
    });
    return unvisitedNeighbors[
      Math.floor(Math.random() * unvisitedNeighbors.length)
    ];
  }

  hasUnvisitedNeighbor(maze, [curr_x, curr_y]) {
    return [
      [curr_x - 1, curr_y],
      [curr_x + 1, curr_y],
      [curr_x, curr_y - 1],
      [curr_x, curr_y + 1]
    ].some(([x, y]) => {
      return maze[x] && maze[x][y] && maze[x][y].hasNotBeenVisited();
    });
  }
}

class Cell {
  constructor() {
    this.walls = {
      RIGHT: true,
      LEFT: true,
      UP: true,
      DOWN: true
    };
    this.visited = false;
  }

  deleteVisited() {
    delete this.visited;
  }

  hasNotBeenVisited() {
    return this.visited === false;
  }

  setVisited() {
    this.visited = true;
  }
}

module.exports = Maze;
