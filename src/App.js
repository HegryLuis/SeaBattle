import React, { useState } from "react";
import "./App.css";
import BoardRedacting from "./Components/BoardRedacting";
import RedactInstruction from "./Components/RedactInstruction";

function App() {
  const [gameFlag, setGameFlag] = useState(true);
  const [board, setBoard] = useState(
    Array(10)
      .fill(null)
      .map(() => Array(10).fill(null))
  );
  const [ships, setShips] = useState([
    {
      row: 0,
      col: 0,
      size: 4,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 3,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 3,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 2,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 2,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 2,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 1,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 1,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 1,
      orientation: "horizontal",
    },
    {
      row: 0,
      col: 0,
      size: 1,
      orientation: "horizontal",
    },
  ]);

  return (
    <div className="App">
      <div className="wrap">
        {gameFlag === true ? (
          <div className="board-redacting">
            <h1 className="redacting-title">Board Redacting</h1>
            <RedactInstruction />
            <BoardRedacting
              board={board}
              handleBoard={setBoard}
              ships={ships}
              handleShips={setShips}
              handleGameFlag={setGameFlag}
            />
          </div>
        ) : (
          <div>OK!</div>
        )}
      </div>
    </div>
  );
}

export default App;
