import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BoardComponent from "../Components/BoardComponent";
import GameState from "../Components/GameState";
import { context } from "../context";
import { Damage } from "../marks/Damage";
import { Miss } from "../marks/Miss";
import CircleTimer from "../Components/CircleTimer";
import { v4 as uuidv4 } from "uuid";
import { Board } from "../Models/Board";

const GamePage = () => {
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
    shotTimer,
    setTurnIndex,
  } = useContext(context);

  const navigate = useNavigate();
  const { gameID } = useParams();
  const [victory, setVictory] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [hasLost, setHasLost] = useState(false);
  const [defeatedPlayers, setDefeatedPlayers] = useState([]);
  const [hasTurnTimedOut, setHasTurnTimedOut] = useState(false);
  const [displayTimer, setDisplayTimer] = useState(shotTimer);
  const [isReadyToHandleTurn, setIsReadyToHandleTurn] = useState(false);
  const [, forceUpdate] = useState(0);
  const pendingEvents = useRef([]);
  const timerId = useRef(null);
  const [gameInitialized, setGameInitialized] = useState(false);

  useEffect(() => {
    if (isMyTurn) {
      setCurrentTargetIndex(0);
    }
  }, [isMyTurn]);

  useEffect(() => {
    if (enemies.length > 0 && turnIndex !== undefined) {
      setIsReadyToHandleTurn(true);
    }
  }, [enemies, turnIndex]);

  useEffect(() => {
    if (enemies.length > 0 && pendingEvents.current.length > 0) {
      pendingEvents.current.forEach(({ type, payload }) => {
        if (type === "changeTurn") handleChangeTurn(payload);
        else handleShoot(type, payload);
      });
      pendingEvents.current = [];
    }
  }, [enemies]);

  useEffect(() => {
    if (myBoard?.cells?.length && enemies.length && turnIndex !== undefined) {
      setGameInitialized(true);
      setIsReadyToHandleTurn(true);
    }
  }, [myBoard, enemies, turnIndex]);

  useEffect(() => {
    if (gameInitialized) {
      console.log("✅ Game is initialized");
    }
  }, [gameInitialized]);

  useEffect(() => {
    if (wss && wss.readyState === WebSocket.OPEN) {
      wss.send(
        JSON.stringify({
          event: "loadGame",
          payload: {
            gameID,
            username: nickname,
          },
        })
      );
    } else {
      // Подключение WebSocket может быть не готово сразу, подожди
      const interval = setInterval(() => {
        if (wss && wss.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          wss.send(
            JSON.stringify({
              event: "loadGame",
              payload: {
                gameID,
                username: nickname,
              },
            })
          );
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [wss, gameID, nickname]);

  function handleTurnTimeout() {
    setHasTurnTimedOut(true);

    if (currentTargetIndex < enemies.length - 1) {
      setCurrentTargetIndex(enemies.length);
    }

    setIsMyTurn(false);
    addLogEntry("Time is up! Turn skipped.");
  }

  function shoot(x, y) {
    if (!gameInitialized) {
      console.log("[shoot] Игра еще не готова");
      return;
    }

    if (!isMyTurn || victory) return;

    const currEnemy = enemies[currentTargetIndex];
    if (!currEnemy || defeatedPlayers.includes(currEnemy.name)) return;

    if (wss.readyState === WebSocket.OPEN) {
      console.log("[shoot] After third if-block. Send to back shoot event");
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

  function handleShoot(type, payload) {
    console.log("[handleShoot]", { type, payload });
    const { shooter, target, x, y } = payload;

    const resultText = type === "hit" ? "Hit" : "Miss";

    addLogEntry(`${shooter} shot ${target} at (${x}, ${y}): ${resultText}`);

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

      setCurrentTargetIndex((prev) => prev + 1);
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

  const addLogEntry = (message) => {
    const newLog = {
      id: uuidv4(),
      message,
      timestamp: new Date().toISOString(),
    };

    setBattleLog((prev) => [...prev, newLog]);

    if (wss && wss.readyState === WebSocket.OPEN) {
      wss.send(
        JSON.stringify({
          event: "log",
          payload: {
            gameID,
            username: nickname,
            log: newLog,
          },
        })
      );
    }
  };

  function handleChangeTurn(payload) {
    setGlobalTurn(payload.globalTurn);
    setHasTurnTimedOut(false);

    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    }

    if (payload.globalTurn === turnIndex) {
      setIsMyTurn(true);

      // Запускаем таймер только при своём ходе
      let localTime = shotTimer;
      setDisplayTimer(localTime);
    } else {
      setIsMyTurn(false);
    }
  }

  function processOrQueue(type, payload) {
    if (
      !enemies ||
      enemies.length === 0 ||
      turnIndex === undefined ||
      globalTurn === undefined
    ) {
      console.log("⏸ Поставлено в очередь", type);
      pendingEvents.current.push({ type, payload });
      forceUpdate((n) => n + 1);
      setIsReadyToHandleTurn(true);
      return;
    }

    console.log("✅ Обрабатывается немедленно", type);
    if (type === "changeTurn") handleChangeTurn(payload);
    else handleShoot(type, payload);
  }

  useEffect(() => {
    // Если это мой ход, таймер ещё не запущен, и нет победы/поражения
    if (isMyTurn && !timerId.current && !victory && !hasLost) {
      let localTime = shotTimer;
      setDisplayTimer(localTime);

      timerId.current = setInterval(() => {
        localTime -= 1;
        setDisplayTimer(localTime);
        if (localTime <= 0) {
          clearInterval(timerId.current);
          timerId.current = null;
          handleTurnTimeout();
        }
      }, 1000);
    }
  }, [isMyTurn, victory, hasLost]);

  useEffect(() => {
    return () => {
      if (timerId.current) {
        clearInterval(timerId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (turnIndex !== undefined && globalTurn !== undefined) {
      setIsMyTurn(globalTurn === turnIndex);
      setIsReadyToHandleTurn(true);
    }
  }, [turnIndex, globalTurn]);

  useEffect(() => {
    if (!wss) {
      console.error("WebSocket не инициализирован");
      return;
    }

    wss.onmessage = function (response) {
      const { type, payload } = JSON.parse(response.data);
      console.log("[onmessage]", type, payload);

      switch (type) {
        case "hit":
        case "miss":
        case "changeTurn":
          processOrQueue(type, payload);
          break;

        case "turnTimeout":
          addLogEntry(`${payload.username}'s time ran out.`);
          if (payload.username === nickname) {
            setIsMyTurn(false);
          }

          break;

        case "playerLost": {
          const { username } = payload;

          if (username === nickname) {
            setHasLost(true);
            addLogEntry("You have been eliminated.");
          } else {
            addLogEntry(`${username} has been eliminated.`);
          }

          setDefeatedPlayers((prev) => [...prev, username]);

          break;
        }

        case "youLost":
          setHasLost(true);
          addLogEntry("You lost the game.");
          break;

        case "victory":
          setVictory(payload.winner);
          break;

        case "loadGame": {
          console.log("LoadGame payload : ", payload);
          const { players, logs, boards, globalTurn, turnIndex } = payload;

          const playerIndex = players.findIndex((p) => p.username === nickname);
          console.log("Player index in players array:", playerIndex);

          if (playerIndex !== -1) {
            setTurnIndex(playerIndex);
            setIsMyTurn(globalTurn === playerIndex);
            setIsReadyToHandleTurn(true);
          } else {
            console.warn("Не удалось найти игрока в списке players");
            setIsMyTurn(false);
          }

          setGlobalTurn(globalTurn);

          setBattleLog(
            (logs || []).map((log) => ({
              ...log,
              id: log.id || uuidv4(),
            }))
          );

          const boardsMap = Object.fromEntries(
            boards.map((b) => [b.username, b])
          );

          const myBoardData = boardsMap[nickname];
          const myBoard = new Board();

          if (myBoardData?.cells) {
            myBoard.setCellsFromServer(myBoardData);
            setMyBoard(myBoard);
          } else {
            console.warn("Нет данных доски для игрока:", nickname);
          }

          const enemyBoards = players
            .filter((p) => p.username !== nickname)
            .map((p) => {
              const board = new Board();
              const data = boardsMap[p.username];
              if (data?.cells) {
                board.setCellsFromServer(data);
              }
              return {
                name: p.username,
                board,
              };
            });

          setEnemies(enemyBoards);

          setIsReadyToHandleTurn(true);
          setGameInitialized(true);

          break;
        }

        case "error":
          console.error("Server error: ", payload.message);
          break;

        case "playerDisconnected":
          addLogEntry(`${payload.username} disconnected.`);
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
    if (!isReadyToHandleTurn) {
      return;
    }

    setIsReadyToHandleTurn(false);

    if (pendingEvents.current.length < 1) {
      return;
    }

    console.log("🔄 flushPendingEvents START", pendingEvents.current);

    if (!isReadyToHandleTurn || pendingEvents.current.length === 0) {
      console.log("🚫 flushPendingEvents: Not ready or empty queue");
      return;
    }

    const queue = [...pendingEvents.current];
    pendingEvents.current = [];

    queue.forEach(({ type, payload }) => {
      console.log("✅ flushing event:", type, payload);
      if (type === "changeTurn") handleChangeTurn(payload);
      else handleShoot(type, payload);
    });
  }, [isReadyToHandleTurn]);

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
        <CircleTimer timeLeft={displayTimer} duration={shotTimer} />
        {enemies.map((enemy) => {
          const currEnemy = enemies[currentTargetIndex] || null;
          const isDefeated = defeatedPlayers.includes(enemy.name);

          return (
            <div
              key={enemy.name}
              className={`enemy-board ${isDefeated ? "defeated" : ""}`}
            >
              <p className="nickname">{enemy.name}</p>

              <p>Current target index: {currentTargetIndex}</p>
              <p>Current target name: {currEnemy?.name}</p>
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
        {isMyTurn && !hasLost && !victory && (
          <p className="turn-timer">Time left: {displayTimer}s</p>
        )}
        {hasLost && (
          <div className="overlay">
            <h2>You lost!</h2>
            <p>Better luck next time!</p>
          </div>
        )}

        <div className="battle-log">
          <h3>Battle Log</h3>

          <ul>
            {battleLog.map((log) => {
              return <li key={log.id}>{log.message}</li>;
            })}
          </ul>
        </div>
        <button onClick={() => navigate("/game")}>Exit to lobby</button>
      </div>
    </div>
  );
};

export default GamePage;
