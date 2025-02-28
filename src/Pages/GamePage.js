import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Board } from "../Models/Board";
import BoardComponent from "../Components/BoardComponent";
import GameState from "../Components/GameState";
import { context } from "../context";

const wss = new WebSocket("ws://localhost:4000");

const GamePage = () => {
  const { gameID } = useParams();
  const { myBoard, setMyBoard, nickname, enemyName } = useContext(context);

  const [enemyBoard, setEnemyBoard] = useState(new Board());
  const [canShoot, setCanShoot] = useState(true);

  useEffect(() => {
    console.log(`My board => ${myBoard}, Nickname => ${nickname}`);
  }, []);

  function shoot(x, y) {
    console.log("shoot");
    wss.send(
      JSON.stringify({
        event: "shoot",
        payload: { username: nickname, x, y, gameID },
      })
    );
  }

  function ready() {
    wss.send(
      JSON.stringify({
        event: "ready",
        payload: { username: nickname, gameID },
      })
    );

    // setShipsReady(true);
  }

  function restart() {
    const newMyBoard = new Board();
    const newEnemyBoard = new Board();

    newMyBoard.initCells();
    newEnemyBoard.initCells();

    setMyBoard(newMyBoard);
    setEnemyBoard(newEnemyBoard);
  }

  function changeBoardAfterShoot(board, setBoard, x, y, isPerfectHit) {
    isPerfectHit ? board.addDamage(x, y) : board.addMiss(x, y);
    const newBoard = board.getCopyBoard();
    setBoard(newBoard);
  }

  wss.onmessage = function (responce) {
    const { type, payload } = JSON.parse(responce.data);
    const { username, x, y, canStart, enemyName, success } = payload;

    switch (type) {
      case "readyToPlay":
        if (payload.username === nickname && canStart) {
          setCanShoot(true);
        }
        break;

      case "afterShootByMe":
        if (username !== nickname) {
          const isPerfectHit = myBoard.cells[y][x].mark?.name === "ship";
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, isPerfectHit);
          wss.send(
            JSON.stringify({
              event: "checkShoot",
              payload: { ...payload, isPerfectHit },
            })
          );

          if (!isPerfectHit) {
            setCanShoot(true);
          }
        }

        break;

      case "isPerfectHit":
        if (username === nickname) {
          changeBoardAfterShoot(
            enemyBoard,
            setEnemyBoard,
            x,
            y,
            payload.isPerfectHit
          );
          payload.isPerfectHit ? setCanShoot(true) : setCanShoot(false);
        }

        break;

      default:
        break;
    }
  };

  return (
    <div>
      <h1>Welcome to the game, my Friend!</h1>

      <div className="boards-wrap">
        <div>
          <p className="nickname">{nickname}</p>
          <BoardComponent
            board={myBoard}
            setBoard={setMyBoard}
            isMyBoard
            canShoot={false}
          />
        </div>

        {
          <div>
            <p className="nickname">{enemyName || "Unknown enemy"}</p>
            <BoardComponent
              board={enemyBoard}
              setBoard={setEnemyBoard}
              canShoot={canShoot}
              shoot={shoot}
            />
          </div>
        }
      </div>

      <GameState canShoot={canShoot} ready={ready} />
    </div>
  );
};

export default GamePage;
