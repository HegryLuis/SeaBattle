import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { context } from "../context";
import RedactComponent from "../Components/RedactComponent";
import { Board } from "../Models/Board";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";
import "./LoginPage.css";
import GameHistory from "../Components/GameHistory";
import Leaderboard from "../Components/Leaderboard";
import Statistic from "../Components/Statistic";
import GameForm from "../Components/GameForm";

const LoginPage = () => {
  const [invitationGame, setInvitationGame] = useState();
  const [waitingStatus, setWaitingStatus] = useState(null);
  const [shipsPlaced, setShipsPlaced] = useState(false);
  const [playersNumber, setPlayersNumber] = useState(2);
  const [mode, setMode] = useState(null); // null, create, enter

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
    shotTimer,
    setShotTimer,
  } = useContext(context);

  const navigate = useNavigate();

  useEffect(() => {
    setGameID("");
    setMyBoard(new Board());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!wss) {
      console.error("WebSocket does not initialized!");
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

  function handleStartGame(payload) {
    const {
      username,
      opponents = [],
      turnIndex,
      globalTurn,
      shotTimer,
    } = payload;

    if (!Array.isArray(opponents)) {
      console.error("Wrong opponents format:", opponents);
      return;
    }

    Cookies.set("nickname", username, { expires: 1 });

    setTurnIndex(turnIndex);
    setGlobalTurn(globalTurn);
    setShotTimer(shotTimer);

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

  const closeMode = () => {
    setMode(null);
    setGameID(null);
    setMyBoard(new Board());
  };

  return (
    <>
      <div className="wrap wrap-login">
        <div className="login-sidebar left-sidebar">
          <div className="sidebar-title-wrap">
            <h2 className="anton">Your history</h2>
          </div>

          <GameHistory />
        </div>

        <div className="login-wrapper">
          <div className="login-select-game-wrapper">
            <h1 className="anton">Select a game mode</h1>

            <div className="login-select-game-btn-wrapper">
              <button className="anton btn" onClick={() => setMode("create")}>
                Create room
              </button>
              <button className="anton btn" onClick={() => setMode("enter")}>
                Enter the room
              </button>
            </div>
          </div>

          {(mode === "create" || mode === "enter") && (
            <GameForm
              invitationGame={invitationGame}
              setInvitationGame={setInvitationGame}
              gameID={gameID}
              setGameID={setGameID}
              playersNumber={playersNumber}
              setPlayersNumber={setPlayersNumber}
              shotTimer={shotTimer}
              setShotTimer={setShotTimer}
              shipsPlaced={shipsPlaced}
              setShipsPlaced={setShipsPlaced}
              waitingStatus={waitingStatus}
              startPlay={startPlay}
              mode={mode}
              onClose={closeMode}
            />
          )}

          <div className="login-sidebar login-leaderboard-wrapper">
            <h1 className="anton">Leaderboard</h1>

            <Leaderboard />
          </div>
        </div>

        <div className="login-sidebar right-sidebar">
          <div className="sidebar-title-wrap">
            <h4 className="anton">{nickname}</h4>
            <h2 className="anton">Your statistic</h2>

            <Statistic />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
