import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Board } from "../Models/Board";
import BoardComponent from "../Components/BoardComponent";
import GameState from "../Components/GameState";
import { context } from "../context";
import { Ship } from "../marks/Ship";

const GamePage = () => {
  const { gameID } = useParams();
  const {
    myBoard,
    setMyBoard,
    nickname,
    enemyName,
    wss,
    isMyTurn,
    setIsMyTurn,
  } = useContext(context);
  const navigate = useNavigate();

  const [enemyBoard, setEnemyBoard] = useState(new Board());

  useEffect(() => {
    console.log(
      `Nickname = ${nickname}, enemyName = ${enemyName} is useEffect`
    );
  }, [nickname, enemyName]);

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
    console.log("Function ready");
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
    const { username, x, y } = payload;

    switch (type) {
      // case "readyToPlay":
      //   if (payload.username === localStorage.nickname) {
      //     setIsMyTurn(true);
      //   }
      //   break;

      case "hit":
        if (payload.username !== localStorage.nickname) {
          // Враг попал по мне
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, true);
        } else {
          // Я попал по врагу
          changeBoardAfterShoot(enemyBoard, setEnemyBoard, x, y, true);
        }
        break;

      case "miss":
        if (payload.username !== localStorage.nickname) {
          // Враг промахнулся
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, false);
        } else {
          // Я промахнулся
          changeBoardAfterShoot(enemyBoard, setEnemyBoard, x, y, false);
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
        }

        break;

      case "changeTurn":
        setIsMyTurn(payload.nextTurn === nickname);

        break;

      case "connectToPlay":
        console.log("connect");
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
              {enemyName}
              {/* {typeof enemyName === "string" ? enemyName : "Unknown enemy"} */}
            </p>
            <BoardComponent
              board={enemyBoard}
              setBoard={setEnemyBoard}
              canShoot={true}
              shoot={shoot}
            />
          </div>
        }
      </div>

      <GameState isMyTurn={isMyTurn} ready={ready} />

      <button onClick={() => navigate("/")}>Log out</button>
    </div>
  );
};

export default GamePage;
