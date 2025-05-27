import { Mark } from "./Mark";
import skull from "./../images/skull.svg";

export class Damage extends Mark {
  constructor(cell) {
    super(cell);
    this.logo = skull;
    this.name = "damage";
    this.color = "red";
  }
}
