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
    enemies,
    setEnemies,
    wss,
    isMyTurn,
    setIsMyTurn,
  } = useContext(context);

  const navigate = useNavigate();

  const [turnIndex, setTurnIndex] = useState(0);
  const [victory, setVictory] = useState(null);

  function shoot(target, x, y) {
    if (!isMyTurn || victory) return;

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
      setEnemies((prev) => {
        prev.map((enemy) => {
          if (enemy.name === target) {
            const boardCopy = [...enemy.board];
            boardCopy[y][x].mark.name = type === "hit" ? "hit" : "miss";
            return { ...enemy, board: boardCopy };
          }
          return enemy;
        });
      });
      // setEnemyBoards((prev) => {
      //   const newBoard = { ...prev };
      //   newBoard[target] = [...prev[target]];
      //   newBoard[target][y][x].mark.name = type === "hit" ? "hit" : "miss";
      //   return newBoard;
      // });
    } else if (target === nickname) {
      setMyBoard((prev) => {
        const newBoard = prev.getCopyBoard();
        newBoard[y][x].mark.name = type === "hit" ? "hit" : "miss";
        return newBoard;
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
        // case "gameStarted":
        //   handleStartGame(payload);
        //   break;

        case "hit":
        case "miss":
          handleShoot(type, payload);
          break;

        case "changeTurn":
          handleChangeTurn(payload);
          // setIsMyTurn(players[payload.turnIndex] === nickname);
          break;

        case "connectToPlay":
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

  useEffect(() => {
    console.log(`Enemies => `, enemies);
  }, [enemies]);

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

        {enemies
          .filter((e) => e.name !== nickname)
          .map((enemy, i) => {
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

        {/* 
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
        } */}
      </div>

      <div className="stats">
        <GameState isMyTurn={isMyTurn} victory={victory} />
        <button onClick={() => navigate("/")}>Log out</button>
      </div>
    </div>
  );
};

export default GamePage;
