import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Board } from "../Models/Board";
import BoardComponent from "../Components/BoardComponent";
import GameState from "../Components/GameState";
import { context } from "../context";

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
  // History move: [{moveID, player, x, y, hit/miss}, {} ...]
  const [historyMove, setHistoryMove] = useState([]);

  // Victory -> player`s name
  // если кораблей больше нет, то сервер должен отправить имя победителя и закончить игру
  const [victory, setVictory] = useState(null);

  function shoot(x, y) {
    if (!isMyTurn || victory) return;

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

  function changeBoardAfterShoot(board, setBoard, x, y, isPerfectHit) {
    isPerfectHit ? board.addDamage(x, y) : board.addMiss(x, y);
    const newBoard = board.getCopyBoard();
    setBoard(newBoard);
  }

  wss.onmessage = function (response) {
    const { type, payload } = JSON.parse(response.data);
    const { username, x, y } = payload;

    switch (type) {
      case "hit":
        if (username !== localStorage.nickname) {
          // Враг попал по мне
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, true);
        } else {
          // Я попал по врагу
          changeBoardAfterShoot(enemyBoard, setEnemyBoard, x, y, true);
        }
        break;

      case "miss":
        if (username !== localStorage.nickname) {
          // Враг промахнулся
          changeBoardAfterShoot(myBoard, setMyBoard, x, y, false);
        } else {
          // Я промахнулся
          changeBoardAfterShoot(enemyBoard, setEnemyBoard, x, y, false);
        }
        break;

      case "changeTurn":
        setIsMyTurn(payload.nextTurn === nickname);

        break;

      case "connectToPlay":
        break;

      case "victory":
        setVictory(payload.winner);
        break;

      default:
        console.log("default: ", response.data);
        break;
    }
  };

  useEffect(() => {
    console.log("Victory = ", victory);
  }, [victory]);

  return (
    <div className="wrap wrap-game">
      <h1 className="game-title">Welcome to the game, my Friend!</h1>

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
            <p className="nickname">{enemyName}</p>
            <BoardComponent
              board={enemyBoard}
              setBoard={setEnemyBoard}
              canShoot={true}
              shoot={shoot}
            />
          </div>
        }
      </div>

      <div className="stats">
        <GameState isMyTurn={isMyTurn} victory={victory} />
        <button onClick={() => navigate("/")}>Log out</button>
      </div>
    </div>
  );
};

export default GamePage;
