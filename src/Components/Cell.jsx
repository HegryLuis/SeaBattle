import React from "react";

const Cell = ({ value, row, col }) => {
    let cellClass = "cell";
    let flag = false;

    if (value === "S") {
        cellClass += " ship";
    } else if (value === "X") {
        cellClass += " hit";
    }

    return (
        <div
            className={cellClass} /*onClick={() => handleSetClick(row, col) }*/
        >
            {flag ? "M" : value}
        </div>
    );
};

export default Cell;
