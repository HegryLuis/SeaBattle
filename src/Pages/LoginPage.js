import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { context } from "../context";
import RedactComponent from "../Components/RedactComponent";
import Header from "../Components/Header/Header";

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
    setIsMyTurn,
    enemyName,
    isAuthenticated,
  } = useContext(context);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/"); // Перенаправлення на сторінку логіну, якщо не авторизований
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    console.log(`Nickname => ${nickname}`);
  }, [nickname]);

  const startPlay = (e) => {
    e.preventDefault();

    if (!gameID) {
      alert("Error! You didn`t enter a name or a game ID");
      return;
    }

    if (!shipsPlaced) {
      alert("Your ships aren`t ready!");
    }

    wss.send(
      JSON.stringify({
        event: "connect",
        payload: { username: nickname, gameID, board: myBoard.serialize() },
      })
    );

    wss.onmessage = (res) => {
      const { type, payload } = JSON.parse(res.data);

      if (type === "connectToPlay" && payload?.success) {
        if (
          payload.enemyName &&
          payload.enemyName !== enemyName &&
          nickname !== payload.enemyName
        ) {
          setEnemyName(payload.enemyName);
          setIsMyTurn(payload.isMyTurn);
          localStorage.nickname = nickname;

          if (gameID) {
            navigate("/game/" + gameID);
          } else {
            console.error("Invalid gameID");
          }
        } else {
          alert("Waiting for enemy");
        }
      }
    };
  };

  return (
    <>
      {/* <Header /> */}
      <div className="wrap">
        <form onSubmit={startPlay}>
          <div className="wrap-input">
            <div className="field-group">
              <h2>Your name {nickname}</h2>
            </div>

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
                        setGameID(Date.now());
                      }}
                    >
                      Generate game ID
                    </button>
                    <p>Generated ID : {gameID}</p>
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
