import React from "react";
import Row from "./Row";

const Board = ({ board }) => {
    return (
        <div className="board">
            {board.map((row, rowIndex) => (
                <Row
                    key={rowIndex}
                    cells={row}
                    rowIndex={rowIndex}
                    // handleSetClick={handleSetClick}
                />
            ))}
        </div>
    );
};

export default Board;
