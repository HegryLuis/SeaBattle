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
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 0; j < 10; j++) {
        row.push(new Cell(this, j, i, null));
      }

      this.cells.push(row);
    }
  }

  getCopyBoard() {
    const newBoard = new Board();
    newBoard.cells = this.cells;
    return newBoard;
  }

  getCells(x, y) {
    return this.cells[y][x];
  }

  getMark(x, y) {
    return this.cells[y][x];
  }

  getOccupied(x, y) {
    return this.cells[x][y].mark === "Ship";
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
}
