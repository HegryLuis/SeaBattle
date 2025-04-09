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

  // cloneMark = (mark) => {
  //   if (!mark) return null;

  //   switch (mark.constructor.name) {
  //     case "Ship":
  //       return new Ship(); // если Ship не требует аргументов
  //     case "Miss":
  //       return new Miss();
  //     case "Damage":
  //       return new Damage();
  //     default:
  //       return null;
  //   }
  // };

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

    serverData.cells.forEach((row) => {
      row.forEach((cell) => {
        if (cell.mark) {
          switch (cell.mark.type) {
            case "Ship":
              this.addShip(cell.x, cell.y);
              break;

            case "Miss":
              this.addMiss(cell.x, cell.y);
              break;

            case "Damage":
              this.addDamage(cell.x, cell.y);
              break;

            default:
              break;
          }
        }
      });
    });
  }
}
