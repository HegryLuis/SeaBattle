import { Mark } from "./Mark";

export class Miss extends Mark {
  constructor(cell) {
    super(cell);
    this.logo = null;
    this.name = "miss";
  }
}
