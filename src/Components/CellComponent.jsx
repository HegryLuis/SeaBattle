import React, { useState } from "react";

const CellComponent = ({ cell, isHighlighted, addMark }) => {
  const [isShooting, setIsShooting] = useState(false);

  const cellClasses = ["cell"];
  if (cell.mark) cellClasses.push(cell.mark.color);
  if (isHighlighted) cellClasses.push("highlight");
  if (isShooting) cellClasses.push("shooting");

  const handleClick = () => {
    if (cell.mark) return;

    setIsShooting(true);

    addMark(cell.x, cell.y);

    setTimeout(() => {
      setIsShooting(false);
    }, 600);
  };

  return (
    <div className={cellClasses.join(" ")} onClick={handleClick}>
      {cell?.mark?.name === "miss" ? <span>•</span> : ""}
      {cell?.mark?.name === "damage" && cell?.mark?.logo && (
        <img src={cell.mark.logo} alt="damage" className="cell-logo" />
      )}
    </div>
  );
};

export default CellComponent;
