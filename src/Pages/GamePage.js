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
    setGlobalTurn,
    turnIndex,
  } = useContext(context);

  const navigate = useNavigate();

  const [victory, setVictory] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [hasLost, setHasLost] = useState(false);
  const [defeatedPlayers, setDefeatedPlayers] = useState([]);

  useEffect(() => {
    if (isMyTurn) {
      setCurrentTargetIndex(0);
    }
  }, [isMyTurn]);

  function shoot(x, y) {
    if (!isMyTurn || victory) return;

    console.log("Shoot");
    const currEnemy = enemies[currentTargetIndex];
    if (!currEnemy || defeatedPlayers.includes(currEnemy.name)) return;

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
      // Мы стреляли
      setEnemies((prevEnemy) =>
        prevEnemy.map((enemy) => {
          if (enemy.name === target && enemy.board?.cells) {
            // Копируем доску (массив клеток)
            const newBoard = enemy.board.getCopyBoard();
            const cell = newBoard.cells[y][x];

            if (type === "hit") {
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
    setGlobalTurn(payload.globalTurn);

    if (!enemies || !enemies.length) {
      console.warn("Список противников ещё не инициализирован");
      return;
    }

    setIsMyTurn(payload.globalTurn === turnIndex);
  }

  useEffect(() => {
    if (!wss) {
      console.error("WebSocket не инициализирован");
      return;
    }

    wss.onmessage = function (response) {
      const { type, payload } = JSON.parse(response.data);

      switch (type) {
        case "hit":
        case "miss":
          console.log("Type =", type);
          handleShoot(type, payload);
          break;

        case "changeTurn":
          handleChangeTurn(payload);
          break;

        case "playerLost": {
          const { username } = payload;

          // Добавим в battle log (если у тебя он есть)
          setBattleLog((prev) => [
            ...prev,
            { type: "playerLost", text: `${username} has been eliminated.` },
          ]);

          // Можно пометить врага как выбывшего (например, чтобы отключить по нему стрельбу или затемнить доску)
          setDefeatedPlayers((prev) => [...prev, username]);

          break;
        }

        case "youLost": {
          setHasLost(true); // например, флаг в состоянии
          setBattleLog((prev) => [
            ...prev,
            { type: "defeat", message: `You have lost the game.` },
          ]);

          // Можно отключить интерфейс игрока
          break;
        }

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

  useEffect(() => {
    console.log(victory);
  }, [victory]);

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
          const isDefeated = defeatedPlayers.includes(enemy.name);

          return (
            <div
              key={enemy.name}
              className={`enemy-board ${isDefeated ? "defeated" : ""}`}
            >
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
                  isMyTurn &&
                  currEnemy &&
                  currEnemy.name === enemy.name &&
                  !hasLost &&
                  !isDefeated
                }
                shoot={(x, y) => shoot(x, y)}
              />
            </div>
          );
        })}
      </div>

      <div className="stats">
        <GameState isMyTurn={isMyTurn} victory={victory} />
        {hasLost && (
          <div className="overlay">
            <h2>You lost!</h2>
            <p>Better luck next time!</p>
          </div>
        )}

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
