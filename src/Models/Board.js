import { Damage } from "../marks/Damage";
import { Miss } from "../marks/Miss";
import { Ship } from "../marks/Ship";
import { Cell } from "./Cell";

export class Board {
  cells = [];

  constructor() {
    this.initCells();
  }

  initCells() {
    this.cells = [];

    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        row.push(new Cell(this, j, i, null));
      }

      this.cells.push(row);
    }
  }

  serialize() {
    return {
      cells: this.cells.map((row) => row.map((cell) => cell.serialize())),
    };
  }

  getCopyBoard() {
    const newBoard = new Board();
    newBoard.cells = this.cells.map((row) =>
      row.map((cell) => new Cell(newBoard, cell.x, cell.y, cell.mark))
    );
    return newBoard;
  }

  getCells(x, y) {
    return this.cells[y][x];
  }

  getMark(x, y) {
    return this.cells[y][x];
  }

  getOccupied(x, y) {
    return this.cells[x][y].mark instanceof Ship;
  }

  addShip(x, y) {
    new Ship(this.getCells(x, y));
  }

  addMiss(x, y) {
    new Miss(this.getCells(x, y));
  }

  addDamage(x, y) {
    new Damage(this.getCells(x, y));
  }

  setCellsFromServer(serverData) {
    this.initCells();

    serverData.cells.forEach((row, y) => {
      row.forEach((cell, x) => {
        const mark = cell.mark;
        if (mark && mark.name) {
          switch (mark.name) {
            case "ship":
              this.addShip(x, y);
              break;

            case "miss":
              this.addMiss(x, y);
              break;

            case "hit":
              this.addDamage(x, y);
              break;

            default:
              console.warn("Unknown mark name:", mark.name);
              break;
          }
        }
      });
    });
  }
}
