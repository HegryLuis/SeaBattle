import React, { useState, useEffect } from "react";
import Board from "./Board";

const BoardRedacting = ({
  board,
  handleBoard,
  ships,
  handleShips,
  handleGameFlag,
}) => {
  const [currIndex, setCurrIndex] = useState(0);

  const handleMoveShips = () => {
    let newBoard = Array(10)
      .fill(null)
      .map(() => Array(10).fill(null));

    for (let i = 0; i < ships.length; i++) {
      const currShip = ships[i];
      for (let j = 0; j < currShip.size; j++) {
        let newRow = currShip.row;
        let newCol = currShip.col;

        if (currShip.orientation === "horizontal") {
          newCol += j;
        } else if (currShip.orientation === "vertical") {
          newRow += j;
        }

        newBoard[newRow][newCol] = "S";
      }
    }

    handleBoard(newBoard);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(handleMoveShips, [ships]);

  const handleKeyDown = (e) => {
    let newShips = [...ships];
    const currShip = newShips[currIndex];

    const isCellOccupied = (row, col) => {
      return board[row][col] === "S";
    };

    const areAdjacentCellsOccupied = (row, col) => {
      const adjacentCells = [
        { row: row + 1, col: col },
        { row: row + 1, col: col - 1 },
        { row: row + 1, col: col + 1 },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 },
        { row: row - 1, col: col },
        { row: row - 1, col: col - 1 },
        { row: row - 1, col: col + 1 },
      ];

      for (const adjacentCell of adjacentCells) {
        if (
          adjacentCell.row >= 0 &&
          adjacentCell.row < 10 &&
          adjacentCell.col >= 0 &&
          adjacentCell.col < 10 &&
          isCellOccupied(row, col)
        ) {
          return true;
        }
      }

      return false;
    };

    switch (e.key) {
      case "ArrowUp":
        if (currShip.row > 0) currShip.row--;
        break;
      case "ArrowDown":
        if (currShip.orientation === "vertical") {
          if (currShip.row + currShip.size - 1 < 9) currShip.row++;
        } else {
          if (currShip.row < 9) currShip.row++;
        }
        break;
      case "ArrowLeft":
        if (currShip.col > 0) currShip.col--;
        break;
      case "ArrowRight":
        if (currShip.orientation === "vertical") {
          if (currShip.col < 9) currShip.col++;
        } else {
          if (currShip.col + currShip.size - 1 < 9) currShip.col++;
        }
        break;
      case "q":
        if (currShip.orientation === "horizontal") {
          if (currShip.row + currShip.size - 2 < 9) {
            currShip.orientation = "vertical";
          }
        } else if (currShip.orientation === "vertical") {
          if (currShip.col + currShip.size - 2 < 9) {
            currShip.orientation = "horizontal";
          }
        }

        break;

      case "Enter":
        if (currIndex < ships.length) {
          let isOccupied = false;
          for (let j = 0; j < currShip.size; j++) {
            let newRow = currShip.row;
            let newCol = currShip.col;

            if (currShip.orientation === "horizontal") {
              newCol += j;
            } else if (currShip.orientation === "vertical") {
              newRow += j;
            }

            if (
              isCellOccupied(newRow, newCol) ||
              areAdjacentCellsOccupied(newRow, newCol)
            ) {
              isOccupied = true;
              break;
            }
          }

          if (!isOccupied) {
            if (currIndex + 1 < 10) {
              setCurrIndex(currIndex + 1);
            } else {
              handleGameFlag(false);
            }
          } else {
            console.log(
              "Cells or adjacent cells are already occupied by another ship."
            );
          }
        } else {
          console.log("END");
        }

        break;
      default:
        break;
    }
    handleShips(newShips);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ships, currIndex]);

  return <Board board={board} />;
};

export default BoardRedacting;
