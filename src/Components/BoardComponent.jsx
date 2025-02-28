import React from "react";
import CellComponent from "./CellComponent";

const BoardComponent = ({
  board,
  setBoard,
  shipsReady,
  isMyBoard,
  canShoot,
  shoot,
  highlightCells = [],
}) => {
  const boardClasses = ["board"];

  if (canShoot) {
    boardClasses.push("active-shoot");
  }

  function addMark(x, y) {
    if (!shipsReady && isMyBoard) {
      board.addShip(x, y);
    } else if (canShoot && !isMyBoard) {
      shoot(x, y);
    }

    updateBoard();
  }

  function updateBoard() {
    const newBoard = board.getCopyBoard();

    setBoard(newBoard);
  }

  return (
    <div className={boardClasses.join(" ")}>
      {board.cells.map((row, rowIndex) => (
        <div key={rowIndex} className="row">
          {row.map((cell) => {
            const isHighlighted = highlightCells.some(
              (highlight) => highlight.x === cell.x && highlight.y === cell.y
            );
            return (
              <CellComponent
                key={cell.id}
                cell={cell}
                addMark={addMark}
                isHighlighted={isHighlighted}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default BoardComponent;
