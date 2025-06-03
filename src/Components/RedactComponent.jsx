import React, { useContext, useEffect, useState } from "react";
import BoardComponent from "./BoardComponent";
import { context } from "../context";
import { Ship } from "../marks/Ship";
import RedactInstruction from "./RedactInstruction";

const RedactComponent = ({ setShipsPlaced }) => {
  const { myBoard, setMyBoard, ships } = useContext(context);
  const [selectedShipIndex, setSelectedShipIndex] = useState(0);
  const [orientation, setOrientation] = useState("horizontal");
  const [shipPosition, setShipPosition] = useState({ x: 0, y: 0 });
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedShipIndex >= ships.length) return;

      let newX = shipPosition.x;
      let newY = shipPosition.y;
      let newOrientation = orientation;
      let currShip = ships[selectedShipIndex];

      switch (e.key) {
        case "ArrowUp":
          if (newY > 0) newY--;
          break;
        case "ArrowDown":
          if (newOrientation === "vertical") {
            if (newY + currShip.size - 1 < 9) newY++;
          } else {
            if (newY < 9) newY++;
          }
          break;
        case "ArrowLeft":
          if (newX > 0) newX--;
          break;
        case "ArrowRight":
          if (newOrientation === "vertical") {
            if (newX < 9) newX++;
          } else {
            if (newX + currShip.size - 1 < 9) newX++;
          }
          break;
        case "q":
          if (newOrientation === "horizontal") {
            if (newY + currShip.size - 1 < 9) newOrientation = "vertical";
          } else {
            if (newX + currShip.size - 1 < 9) newOrientation = "horizontal";
          }
          break;
        case "Enter":
          if (canPlaceShip(newX, newY, currShip.size, newOrientation)) {
            placeShip(newX, newY, currShip.size, newOrientation);
            setSelectedShipIndex((prev) => prev + 1);
          } else {
            alert("Cannot put ship here! Try again");
          }
          break;
        default:
          break;
      }

      setShipPosition({ x: newX, y: newY });
      setOrientation(newOrientation);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shipPosition, orientation, selectedShipIndex, ships]);

  useEffect(() => {
    setShipsPlaced(selectedShipIndex >= ships.length);
  }, [selectedShipIndex, ships.length]);

  const canPlaceShip = (x, y, size, orientation) => {
    for (let i = 0; i < size; i++) {
      let posX = orientation === "horizontal" ? x + i : x;
      let posY = orientation === "vertical" ? y + i : y;
      if (myBoard.getCells(posX, posY).mark instanceof Ship) {
        return false;
      }
    }
    return true;
  };

  const placeShip = (x, y, size, orientation) => {
    const newBoard = myBoard.getCopyBoard();
    for (let i = 0; i < size; i++) {
      let posX = orientation === "horizontal" ? x + i : x;
      let posY = orientation === "vertical" ? y + i : y;
      newBoard.addShip(posX, posY);
    }
    setMyBoard(newBoard);
  };

  const highlightShip = () => {
    if (selectedShipIndex >= ships.length) return [];

    const { size } = ships[selectedShipIndex];
    const highlights = [];

    for (let i = 0; i < size; i++) {
      let posX =
        orientation === "horizontal" ? shipPosition.x + i : shipPosition.x;
      let posY =
        orientation === "vertical" ? shipPosition.y + i : shipPosition.y;
      highlights.push({ x: posX, y: posY });
    }

    return highlights;
  };

  return (
    <div className="redact__wrap" tabIndex={0}>
      <div className="redacting-title">
        <h2>Ship Placement</h2>
        <div className="help-button" onClick={() => setShowHelp(true)}>
          ?
        </div>
      </div>
      {selectedShipIndex < ships.length ? (
        <p className="anton">
          Placing ship {selectedShipIndex + 1} of {ships.length}.
        </p>
      ) : (
        <p className="anton">Your ships are ready</p>
      )}

      <BoardComponent
        board={myBoard}
        setBoard={setMyBoard}
        shipsReady={false}
        canShoot={false}
        isMyBoard={true}
        highlightCells={highlightShip()}
      />

      {showHelp && (
        <div className="help-modal">
          <button className="close-button" onClick={() => setShowHelp(false)}>
            ×
          </button>
          <RedactInstruction />
        </div>
      )}
    </div>
  );
};

export default RedactComponent;
