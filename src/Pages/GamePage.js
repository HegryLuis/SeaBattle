import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Board } from "../Models/Board";
import BoardComponent from "../Components/BoardComponent";
import GameState from "../Components/GameState";
import { context } from "../context";
import { Ship } from "../marks/Ship";

const GamePage = () => {
  const { gameID } = useParams();
  const { myBoard, setMyBoard, nickname, enemyName, wss } = useContext(context);
  const navigate = useNavigate();

  const [enemyBoard, setEnemyBoard] = useState(new Board());
  const [canShoot, setCanShoot] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(true);

  function shoot(x, y) {
    if (!isMyTurn) return;
    console.log("shoot");

    if (wss.readyState === WebSocket.OPEN) {
      wss.send(
        JSON.stringify({
          event: "shoot",
          payload: { username: nickname, x, y, gameID },
        })
      );
    } else {
      console.error("WebSocket не открыт. Состояние:", wss.readyState);
    }

    // wss.send(
    //   JSON.stringify({
    //     event: "shoot",
    //     payload: { username: nickname, x, y, gameID },
    //   })
    // );
  }

  function ready() {
    wss.send(
      JSON.stringify({
        event: "ready",
        payload: {
          username: localStorage.nickname,
          gameID,
          board: myBoard.cells,
        },
      })
    );
  }

  function restart() {
    const newMyBoard = new Board();
    const newEnemyBoard = new Board();

    newMyBoard.initCells();
    newEnemyBoard.initCells();

    setMyBoard(newMyBoard);
    setEnemyBoard(newEnemyBoard);
    setIsMyTurn(false);
  }

  function changeBoardAfterShoot(board, setBoard, x, y, isPerfectHit) {
    isPerfectHit ? board.addDamage(x, y) : board.addMiss(x, y);
    const newBoard = board.getCopyBoard();
    setBoard(newBoard);
  }

  wss.onmessage = function (response) {
    const { type, payload } = JSON.parse(response.data);
    const { username, x, y, canStart, isPerfectHit } = payload;

    switch (type) {
      case "readyToPlay":
        if (payload.username === localStorage.nickname && canStart) {
          setIsMyTurn(true);
        }
        break;

      case "hit":
      case "miss":
        // Обрабатываем выстрелы
        if (payload.username !== localStorage.nickname) {
          const isHit = type === "hit";
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, isHit);
          setIsMyTurn(true); // Ваш ход после выстрела
        }
        break;

      case "afterShootByMe":
        console.log("afterShootByMe");
        if (username !== localStorage.nickname) {
          const isPerfectHit = myBoard.cells[y][x]?.mark instanceof Ship;
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, isPerfectHit);
          wss.send(
            JSON.stringify({
              event: "checkShoot",
              payload: { ...payload, isPerfectHit },
            })
          );

          if (!isPerfectHit) {
            setIsMyTurn(true);
          }
        }

        break;

      case "isPerfectHit":
        console.log("is Perfect Hit");
        console.log(`Received shoot\n data => ${response.data} `);
        // if (username === localStorage.nickname) {
        //   changeBoardAfterShoot(enemyBoard, setEnemyBoard, x, y, isPerfectHit);
        //   setIsMyTurn(!isPerfectHit);
        // }

        break;

      default:
        console.log("default: ", response.data);
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
            <p className="nickname">
              {typeof enemyName === "string" ? enemyName : "Unknown enemy"}
            </p>
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
      {/* <button onClick={() => handleShoot(3, 4)}>Выстрелить (3,4)</button> */}

      <button onClick={() => navigate("/")}>Log out</button>
    </div>
  );
};

export default GamePage;
