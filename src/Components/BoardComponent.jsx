import React, { useEffect } from "react";
import CellComponent from "./CellComponent";

const BoardComponent = ({
  board,
  setBoard,
  isMyBoard,
  canShoot,
  shoot,
  highlightCells = [],
}) => {
  function addMark(x, y) {
    if (!isMyBoard && canShoot) {
      shoot(x, y);
    }

    updateBoard();
  }

  function updateBoard() {
    setBoard(board.getCopyBoard());
  }

  if (!board || !Array.isArray(board.cells)) {
    console.error("board или board.cells не валиден:", board);
    return null;
  }

  return (
    <div className={`board ${canShoot ? "active-shoot " : ""}`}>
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
