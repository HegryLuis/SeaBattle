// import React, { useState, useEffect } from "react";
// import Board from "./Board";

// const BoardBot = ({ board, handleBoard, ships, setShips }) => {
//   const [currIndex, setCurrIndex] = useState(0);

//   const placeShipRandomly = () => {
//     let newBoard = Array(10)
//       .fill(null)
//       .map(() => Array(10).fill(null));
//     for (let i = 0; i < ships.length; i++) {
//       let currShip = ships[i];
//       newBoard[currShip.row][currShip.col] = "S";
//     }

//     handleBoard(newBoard);
//   };

//   useEffect(() => {
//     placeShipRandomly();
//   }, [currIndex]);

//   return (
//     <div className="board">
//       <Board board={board} />
//     </div>
//   );
// };

// export default BoardBot;
