import React from "react";

const CellComponent = ({ cell, isHighlighted, addMark }) => {
  const cellClasses = ["cell"];
  if (cell.mark) cellClasses.push(cell.mark.color);
  if (isHighlighted) cellClasses.push("highlight");

  // cellClasses.push(cell?.mark?.color);

  return (
    <div
      className={cellClasses.join(" ")}
      onClick={() => addMark(cell.x, cell.y)}
    >
      {cell?.mark?.name === "miss" ? <span>•</span> : ""}
    </div>
  );
};

export default CellComponent;
