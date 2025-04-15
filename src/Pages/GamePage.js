import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BoardComponent from "../Components/BoardComponent";
import GameState from "../Components/GameState";
import { context } from "../context";
import { Damage } from "../marks/Damage";
import { Miss } from "../marks/Miss";

const GamePage = () => {
  const { gameID } = useParams();
  const {
    myBoard,
    setMyBoard,
    nickname,
    enemies,
    setEnemies,
    wss,
    isMyTurn,
    setIsMyTurn,
  } = useContext(context);

  const navigate = useNavigate();

  const [turnIndex, setTurnIndex] = useState(0);
  const [victory, setVictory] = useState(null);

  useEffect(() => {
    console.log(`Turn index = ${turnIndex} \nIs my turn = ${isMyTurn}`);
  }, [isMyTurn, turnIndex]);

  function shoot(target, x, y) {
    if (!isMyTurn || victory) return;

    console.log("Shoot");

    if (wss.readyState === WebSocket.OPEN) {
      wss.send(
        JSON.stringify({
          event: "shoot",
          payload: { username: nickname, x, y, gameID, target },
        })
      );
    } else {
      console.error("WebSocket не открыт. Состояние:", wss.readyState);
    }
  }

  function handleShoot(type, payload) {
    const { shooter, target, x, y } = payload;

    if (shooter === nickname) {
      console.log(`My name is ${nickname}, and I am a shooter`);
      // Мы стреляли
      setEnemies((prevEnemy) =>
        prevEnemy.map((enemy) => {
          if (enemy.name === target && enemy.board?.cells) {
            // Копируем доску (массив клеток)
            const newBoard = enemy.board.getCopyBoard();
            const cell = newBoard.cells[y][x];

            if (type == "hit") {
              cell.mark = new Damage(cell);
            } else {
              cell.mark = new Miss(cell);
            }

            return {
              ...enemy,
              board: newBoard,
            };
          }

          return enemy;
        })
      );
    } else if (target === nickname) {
      console.log(`My name is ${nickname}, and I have been shot`);
      // По нам стреляли
      setMyBoard((prevBoard) => {
        const newBoard = prevBoard.getCopyBoard();
        const cell = newBoard.cells[y][x];

        if (type === "hit") {
          cell.mark = new Damage(cell);
        } else {
          cell.mark = new Miss(cell);
        }
        return newBoard;
      });
    } else {
      // Мы наблюдаем перестрелку других
      console.log(`My name is ${nickname}, and I saw the shoot`);

      setEnemies((prevEnemies) => {
        return prevEnemies.map((enemy) => {
          if (enemy.name === target && enemy?.board.cells) {
            const newBoard = enemy.board.getCopyBoard();
            const cell = newBoard.cells[y][x];

            cell.mark = type === "hit" ? new Damage(cell) : new Miss(cell);

            return { ...enemy, board: newBoard };
          }

          return enemy;
        });
      });
    }
  }

  function handleChangeTurn(payload) {
    const nextTurn = payload.turnIndex;
    setTurnIndex(nextTurn);

    if (!enemies || !enemies.length) {
      console.warn("Список противников ещё не инициализирован");
      return;
    }

    // Собираем всех игроков (включая себя)
    const allPlayers = [nickname, ...enemies.map((e) => e.name)];

    const currentPlayer = allPlayers[nextTurn];
    setIsMyTurn(currentPlayer === nickname);
  }

  function getNextTurnIndex(currentIndex, playersList) {
    return (currentIndex + 1) % playersList.length;
  }

  useEffect(() => {
    if (!wss) {
      console.error("WebSocket не инициализирован");
      return;
    }

    wss.onmessage = function (response) {
      const { type, payload } = JSON.parse(response.data);
      const { username, x, y } = payload;

      switch (type) {
        case "hit":
        case "miss":
          console.log("Type =", type);
          handleShoot(type, payload);
          break;

        case "changeTurn":
          handleChangeTurn(payload);
          break;

        case "victory":
          setVictory(payload.winner);
          break;

        default:
          console.warn("Unknown event type :", type, payload);
          break;
      }
    };

    return () => {
      wss.onmessage = null;
    };
  }, [wss, nickname]);

  return (
    <div className="wrap wrap-game">
      <h1 className="game-title">Battle has begun!</h1>

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

        {enemies.map((enemy) => {
          return (
            <div key={enemy.name}>
              <p className="nickname">{enemy.name}</p>
              <BoardComponent
                board={enemy.board}
                setBoard={(newBoard) => {
                  setEnemies((prev) =>
                    prev.map((e) =>
                      e.name === enemy.name ? { ...e, board: newBoard } : e
                    )
                  );
                }}
                canShoot={isMyTurn}
                shoot={(x, y) => shoot(enemy.name, x, y)}
              />
            </div>
          );
        })}
      </div>

      <div className="stats">
        <GameState isMyTurn={isMyTurn} victory={victory} />
        <button onClick={() => navigate("/")}>Log out</button>
      </div>
    </div>
  );
};

export default GamePage;
