export class Mark {
  constructor(cell) {
    this.cell = cell;
    this.cell.mark = this;
    this.logo = null;
    this.color = null;
    this.id = Math.random();
    this.name = "";
  }

  serialize() {
    return {
      name: this.name,
      logo: this.logo,
      color: this.color,
      id: this.id,
    };
  }
}
