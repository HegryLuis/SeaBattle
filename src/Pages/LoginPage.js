import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { context } from "../context";
import RedactComponent from "../Components/RedactComponent";

const LoginPage = () => {
  const [invitationGame, setInvitationGame] = useState();
  const [shipsPlaced, setShipsPlaced] = useState(false);
  const {
    nickname,
    setNickname,
    gameID,
    setGameID,
    setEnemyName,
    myBoard,
    wss,
  } = useContext(context);

  const navigate = useNavigate();

  const startPlay = (e) => {
    e.preventDefault();

    console.log("Start play function");

    if (!nickname || !gameID) {
      alert("Error! You didn`t enter a name or a game ID");
      return;
    }

    if (!shipsPlaced) {
      alert("Your ships aren`t ready!");
    }

    console.log("Event connect");

    wss.send(
      JSON.stringify({
        event: "connect",
        payload: { username: nickname, gameID, board: myBoard.serialize() },
      })
    );

    wss.onmessage = (res) => {
      const { type, payload } = JSON.parse(res.data);
      console.log("Received info from server");

      if (type === "connectToPlay" && payload?.success) {
        console.log(payload);

        if (payload.enemyName) {
          localStorage.nickname = nickname;
          setEnemyName(payload.enemyName);

          // Закрытие WebSocket после успешного подключения (если нужно)

          if (gameID) {
            console.log("Navigating to /game/", gameID);
            navigate("/game/" + gameID);
          } else {
            console.error("Невалидный gameID");
          }
        } else {
          alert("Waiting for enemy");
        }
      }
    };

    // // Проверка, что WebSocket открыт перед отправкой
    // if (wss.readyState === WebSocket.OPEN) {
    // } else {
    //   alert("WebSocket is not connected yet.");
    // }

    // wss.onmessage = async (res) => {
    //   // const { type, payload } = JSON.parse(res.data);
    //   let type, payload;

    //   try {
    //     if (res.data instanceof Blob) {
    //       const textData = await res.data.text(); // Преобразуем Blob в текст
    //       console.log("Received Blob data:", textData);
    //       ({ type, payload } = JSON.parse(textData)); // Теперь можно парсить
    //     } else {
    //       ({ type, payload } = JSON.parse(res.data));
    //     }
    //   } catch (error) {
    //     console.error("Error parsing message:", error, res.data);
    //     return;
    //   }

    //   if (type === "connectToPlay" && payload.success) {
    //     if (payload) {
    //       console.log(payload);
    //     }

    //     if (payload.enemyName) {
    //       localStorage.nickname = nickname;
    //       setEnemyName(payload.enemyName);
    //       navigate("/game/" + gameID);
    //     } else {
    //       alert("Waiting for enemy");
    //     }
    //   }
    // };
  };

  return (
    <div className="wrap">
      <form onSubmit={startPlay}>
        <h2>Authorization</h2>

        <div className="field-group">
          <div>
            <label htmlFor="nickname">Your nickname</label>
          </div>
          <input
            type="text"
            name="nickname"
            id="nickname"
            onChange={(e) => {
              setNickname(e.target.value);
            }}
          />
        </div>

        <div
          className="field-group"
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
                  setGameID(Date.now());
                }}
              >
                Generate game ID
              </button>
              <p>Generated ID : {gameID}</p>
            </>
          )}
        </div>

        <div className="board-redacting">
          <h1 className="redacting-title">Board Redacting</h1>
          <RedactComponent setShipsPlaced={setShipsPlaced} />
        </div>

        {!shipsPlaced ? (
          <p>Your ships aren`t ready</p>
        ) : (
          <button type="submit" className="btn-ready">
            PLAY NOW!
          </button>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
