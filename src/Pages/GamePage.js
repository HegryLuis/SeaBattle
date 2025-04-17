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
    globalTurn,
    setGlobalTurn,
    turnIndex,
    setTurnIndex,
  } = useContext(context);

  const navigate = useNavigate();

  const [victory, setVictory] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);

  useEffect(() => {
    if (isMyTurn) {
      setCurrentTargetIndex(0);
    }
  }, [isMyTurn]);

  function shoot(x, y) {
    if (!isMyTurn || victory) return;

    const currEnemy = enemies[currentTargetIndex];
    if (!currEnemy) return;

    const target = currEnemy.name;

    if (wss.readyState === WebSocket.OPEN) {
      wss.send(
        JSON.stringify({
          event: "shoot",
          payload: { username: nickname, x, y, gameID },
        })
      );
      setCurrentTargetIndex((prev) => prev + 1);
    } else {
      console.error("WebSocket не открыт. Состояние:", wss.readyState);
    }
  }

  function handleShoot(type, payload) {
    const { shooter, target, x, y } = payload;

    const resultText = type === "hit" ? "Hit" : "Miss";

    setBattleLog((prevLog) => [
      { text: `${shooter} => ${target} at (${x}, ${y}) -- ${resultText}` },
      ...prevLog,
    ]);

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
    console.log(`Handle Change Turn\n`);
    console.log("Payload global turn = ", payload.globalTurn);
    console.log("Turn index = ", turnIndex);

    // const nextTurn = payload.globalTurn;
    setGlobalTurn(payload.globalTurn);

    if (!enemies || !enemies.length) {
      console.warn("Список противников ещё не инициализирован");
      return;
    }

    setIsMyTurn(payload.globalTurn === turnIndex);

    // Собираем всех игроков (включая себя)
    // const allPlayers = [nickname, ...enemies.map((e) => e.name)];

    // const currentPlayer = allPlayers[nextTurn];
    // setIsMyTurn(currentPlayer === nickname);
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
          const currEnemy = enemies[currentTargetIndex] || null;
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
                canShoot={
                  isMyTurn && currEnemy && currEnemy.name === enemy.name
                }
                shoot={(x, y) => shoot(x, y)}
              />
            </div>
          );
        })}
      </div>

      <div className="stats">
        <GameState isMyTurn={isMyTurn} victory={victory} />
        <div className="battle-log">
          <h3>Battle Log</h3>

          <ul>
            {battleLog.map((log, index) => {
              return <li key={index}>{log.text}</li>;
            })}
          </ul>
        </div>
        <button onClick={() => navigate("/")}>Log out</button>
      </div>
    </div>
  );
};

export default GamePage;
