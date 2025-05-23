import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { context } from "../context";
import RedactComponent from "../Components/RedactComponent";
import { Board } from "../Models/Board";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

const LoginPage = () => {
  const [invitationGame, setInvitationGame] = useState();
  const [waitingStatus, setWaitingStatus] = useState(null);
  const [shipsPlaced, setShipsPlaced] = useState(false);
  const [playersNumber, setPlayersNumber] = useState(2);
  const [shotTimer, setShotTimer] = useState(20);
  const {
    nickname,
    gameID,
    setGameID,
    myBoard,
    setMyBoard,
    wss,
    isAuthenticated,
    setEnemies,
    setTurnIndex,
    setIsMyTurn,
    setGlobalTurn,
  } = useContext(context);

  const navigate = useNavigate();

  useEffect(() => {
    setGameID("");
    setMyBoard(new Board());
  }, []);

  function handleStartGame(payload) {
    const { username, opponents = [], turnIndex, globalTurn } = payload;

    if (!Array.isArray(opponents)) {
      console.error("Некоректний формат opponents:", opponents);
      return;
    }

    Cookies.set("nickname", username, { expires: 1 });

    setTurnIndex(turnIndex);
    setGlobalTurn(globalTurn);

    const updatedEnemies = opponents.map((enemy) => {
      return {
        name: enemy.name,
        turnIndex: enemy.turnIndex,
        board: new Board(),
      };
    });

    setEnemies(updatedEnemies);
    setIsMyTurn(turnIndex === globalTurn);
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!wss) {
      console.error("WebSocket (wss) не ініціалізований!");
      return;
    }

    const handleMessage = (res) => {
      const { type, payload } = JSON.parse(res.data);

      if (type === "gameStarted") {
        handleStartGame(payload);
        navigate("/game/" + gameID);
      }

      if (type === "waitingForPlayers") {
        setWaitingStatus(
          `Waiting for players: ${payload.playersCount} / ${payload.playersNeeded}`
        );
      }
    };

    wss.addEventListener("message", handleMessage);

    return () => {
      wss.removeEventListener("message", handleMessage);
    };
  }, [wss, gameID, navigate]);

  //
  //
  //

  const startPlay = (e) => {
    e.preventDefault();

    if (!gameID) {
      alert("Error! You didn`t enter a name or a game ID");
      return;
    }

    if (!shipsPlaced) {
      alert("Your ships aren`t ready!");
    }

    console.log(`Sending connecting request`);

    wss.send(
      JSON.stringify({
        event: "connect",
        payload: {
          username: nickname,
          gameID,
          board: myBoard.serialize(),
          playersNum: Number(playersNumber),
          shotTimer: Number(shotTimer),
        },
      })
    );
  };

  return (
    <>
      <div className="wrap">
        <div className="field-group">
          <h2>Your name {nickname}</h2>
        </div>

        <button onClick={() => navigate("/history")}>See Game History</button>
        <form onSubmit={startPlay}>
          <div className="wrap-input">
            <div className="id-input-wrap">
              <div
                className="field-group radio-input"
                onChange={(e) => {
                  setInvitationGame(e.target.id === "ingame");
                }}
              >
                <input
                  type="radio"
                  name="typeEnter"
                  id="gen"
                  value={!invitationGame}
                  defaultChecked={!invitationGame}
                />
                <label htmlFor="gen">Create new game</label>

                <input
                  type="radio"
                  name="typeEnter"
                  id="ingame"
                  value={invitationGame}
                  defaultChecked={invitationGame}
                />
                <label htmlFor="ingame">Enter in by id</label>
              </div>

              <div className="field-group">
                {invitationGame ? (
                  <>
                    <div>
                      <label htmlFor="gameID">Enter game ID</label>
                    </div>
                    <input
                      type="text"
                      name="gameID"
                      defaultValue=""
                      id="gameID"
                      onChange={(e) => {
                        setGameID(e.target.value);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <button
                      className="btn-gen"
                      onClick={(e) => {
                        e.preventDefault();
                        setGameID(uuidv4());
                      }}
                    >
                      Generate game ID
                    </button>
                    <p>Generated ID : {gameID}</p>

                    <div className="field-group">
                      <label htmlFor="numOfPlayers">
                        <strong>Number of players : </strong>
                      </label>
                      <input
                        type="number"
                        id="players"
                        name="players"
                        min="2"
                        max="4"
                        value={playersNumber}
                        onChange={(e) => {
                          setPlayersNumber(e.target.value);
                        }}
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="timer">
                        <strong>Time per shot (seconds):</strong>
                      </label>
                      <input
                        type="number"
                        id="timer"
                        name="timer"
                        min="10"
                        max="60"
                        value={shotTimer}
                        onChange={(e) => {
                          const value = Math.max(
                            10,
                            Math.min(60, Number(e.target.value))
                          );
                          setShotTimer(value);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="board-redacting">
            <h1 className="redacting-title">Board Redacting</h1>
            <RedactComponent setShipsPlaced={setShipsPlaced} />
          </div>

          {!shipsPlaced ? (
            <div className="redacting-status">
              <p>Your ships aren`t ready</p>
            </div>
          ) : (
            <div className="redacting-status">
              {waitingStatus && (
                <div className="waiting-status">
                  <p>{waitingStatus}</p>
                </div>
              )}
              <button
                type="submit"
                className="btn-ready redacting-status"
                disabled={!shipsPlaced}
              >
                PLAY NOW!
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default LoginPage;
