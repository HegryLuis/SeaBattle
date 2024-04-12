import React from "react";
import Cell from "./Cell";

const Row = ({ cells, rowIndex }) => {
    return (
        <div key={rowIndex} className="row">
            {cells.map((cell, cellIndex) => (
                <Cell
                    key={cellIndex}
                    value={cell}
                    row={rowIndex}
                    col={cellIndex}
                    // handleSetClick={handleSetClick}
                />
            ))}
        </div>
    );
};
export default Row;
