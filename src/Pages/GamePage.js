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
import GameResults from "../Components/GameResults";

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
    const checkGameID = async () => {
      try {
        const res = await fetch("http://localhost:4001/api/activeGamesIDs");
        const data = await res.json();

        if (!data.gameIDs.includes(gameID)) {
          navigate("*");
        } else {
          console.log("OK");
        }
      } catch (error) {
        console.error("Failed to validate gameID:", error);
        navigate("*");
      }
    };

    checkGameID();
  }, [gameID]);

  useEffect(() => {
    if (enemies.length > 0 && turnIndex !== undefined) {
      setIsReadyToHandleTurn(true);
    }
  }, [enemies, turnIndex]);

  useEffect(() => {
    if (enemies.length === 0) {
      setCurrentTargetIndex(0);
      return;
    }

    // Если currentTargetIndex указывает на проигравшего, сдвигаем его
    if (currentTargetIndex >= enemies.length) {
      setCurrentTargetIndex(0);
    }
  }, [enemies, currentTargetIndex]);

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
      console.log("Game does not ready yet");
      return;
    }

    if (!isMyTurn || victory) return;

    const currEnemy = enemies[currentTargetIndex];
    if (!currEnemy || defeatedPlayers.includes(currEnemy.name)) return;

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

  function handleShoot(type, payload) {
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

    let localTime = shotTimer;
    setDisplayTimer(localTime);

    const isNowMyTurn = payload.globalTurn === turnIndex;
    setIsMyTurn(isNowMyTurn);

    timerId.current = setInterval(() => {
      localTime -= 1;
      setDisplayTimer(localTime);

      if (localTime <= 0) {
        clearInterval(timerId.current);
        timerId.current = null;

        if (isNowMyTurn) {
          handleTurnTimeout();
        }
      }
    }, 1000);
  }

  function processOrQueue(type, payload) {
    if (
      !enemies ||
      enemies.length === 0 ||
      turnIndex === undefined ||
      globalTurn === undefined
    ) {
      pendingEvents.current.push({ type, payload });
      forceUpdate((n) => n + 1);
      setIsReadyToHandleTurn(true);
      return;
    }

    if (type === "changeTurn") handleChangeTurn(payload);
    else handleShoot(type, payload);
  }

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

          setDefeatedPlayers((prev) => {
            const newDefeated = [...prev, username];

            // Обновляем enemies, исключая проигравших
            setEnemies((prevEnemies) =>
              prevEnemies.filter((enemy) => !newDefeated.includes(enemy.name))
            );

            return newDefeated;
          });

          if (username === nickname) {
            setHasLost(true);
            addLogEntry("You have been eliminated.");
          } else {
            addLogEntry(`${username} has been eliminated.`);
          }

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
          const { players, logs, boards, globalTurn } = payload;

          const playerIndex = players.findIndex((p) => p.username === nickname);

          if (playerIndex !== -1) {
            setTurnIndex(playerIndex);
            setGlobalTurn(globalTurn);
            const isMyTurnNow = globalTurn === playerIndex;

            setIsMyTurn(isMyTurnNow);
            setIsReadyToHandleTurn(true);

            if (isMyTurnNow) {
              handleChangeTurn({ globalTurn });
            }
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
          const defeatedUsernames = payload.defeatedPlayers || [];

          const enemyBoards = players
            .filter(
              (p) =>
                p.username !== nickname &&
                !defeatedUsernames.includes(p.username)
            )
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
          setDefeatedPlayers(defeatedUsernames);

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

    if (!isReadyToHandleTurn || pendingEvents.current.length === 0) {
      return;
    }

    const queue = [...pendingEvents.current];
    pendingEvents.current = [];

    queue.forEach(({ type, payload }) => {
      if (type === "changeTurn") handleChangeTurn(payload);
      else handleShoot(type, payload);
    });
  }, [isReadyToHandleTurn]);

  return (
    <>
      {victory === null && !hasLost && (
        <div className="wrap wrap-game">
          <div className="boards-wrap">
            <div>
              <p className="nickname">{`${nickname} (You)`}</p>
              <BoardComponent
                board={myBoard}
                setBoard={setMyBoard}
                isMyBoard
                canShoot={false}
              />
            </div>
            <div className="circle-timer-wrap">
              <p className="anton">
                {isMyTurn ? "Your turn" : "Opponent's turn"}
              </p>
              <CircleTimer timeLeft={displayTimer} duration={shotTimer} />
            </div>
            <div
              className={`enemies-container ${
                enemies.length >= 2 ? "enemies-more-than-one" : ""
              }`}
            >
              {enemies.map((enemy) => {
                const currEnemy = enemies[currentTargetIndex] || null;
                const isDefeated = defeatedPlayers.includes(enemy.name);

                return (
                  <div
                    key={enemy.name}
                    className={`enemy-board ${isDefeated ? "defeated" : ""}`}
                  >
                    <p className="nickname">
                      {currEnemy?.name === enemy.name
                        ? `${enemy.name} (Current target)`
                        : enemy.name}
                    </p>

                    <BoardComponent
                      board={enemy.board}
                      setBoard={(newBoard) => {
                        setEnemies((prev) =>
                          prev.map((e) =>
                            e.name === enemy.name
                              ? { ...e, board: newBoard }
                              : e
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
          </div>

          <div className="stats">
            <div className="stats-wrap">
              <GameState isMyTurn={isMyTurn} victory={victory} />
              {!hasLost && !victory && (
                <p className="turn-timer">
                  {isMyTurn ? "(Your turn)" : "(Opponent's turn)"}
                </p>
              )}
              {hasLost && (
                <div className="overlay">
                  <h2>You lost!</h2>
                  <p>Better luck next time!</p>
                </div>
              )}

              <button className="btn-black" onClick={() => navigate("/game")}>
                Leave the game
              </button>
            </div>

            <div className="battle-log">
              <h3 className="anton">Battle Log</h3>
              <ul>
                {battleLog.map((log) => (
                  <li className="anton" key={log.id}>
                    {log.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {(victory !== null || hasLost) && (
        <GameResults result={victory === nickname ? "win" : "lose"} />
      )}
    </>
  );
};

export default GamePage;
