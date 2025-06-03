import { Mark } from "./Mark";

export class Ship extends Mark {
  constructor(cell, size) {
    super(cell);
    this.logo = null;
    this.name = "ship";
    this.color = "blue";
  }
}
