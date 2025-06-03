import React, { useState, useContext } from "react";
import { context } from "../context";
import { v4 as uuidv4 } from "uuid";
import RedactComponent from "../Components/RedactComponent";

const GameForm = ({
  gameID,
  setGameID,
  playersNumber,
  setPlayersNumber,
  shotTimer,
  setShotTimer,
  shipsPlaced,
  setShipsPlaced,
  waitingStatus,
  startPlay,
  mode,
  onClose,
}) => {
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Game ID copied to clipboard!");
      })
      .catch((err) => {
        console.error("Copy failed", err);
      });
  };

  return (
    <div className="game-form-wrapper">
      <div className="game-form-box">
        <form onSubmit={startPlay}>
          <div className="wrap-input">
            <div className="id-input-wrap">
              {mode === "enter" ? (
                <>
                  <div className="input-generated-id-wrap">
                    <label htmlFor="gameID">Enter game ID</label>
                    <input
                      type="text"
                      name="gameID"
                      id="gameID"
                      value={gameID}
                      onChange={(e) => setGameID(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="generate-id-wrap">
                    <button
                      className="btn-gen"
                      onClick={(e) => {
                        e.preventDefault();
                        setGameID(uuidv4());
                      }}
                    >
                      Generate game ID
                    </button>
                    <div>
                      <h4>Generated ID: </h4>
                      <span
                        className="generated-id"
                        onClick={() => copyToClipboard(gameID)}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        {gameID}
                      </span>
                    </div>
                  </div>

                  <div className="field-group-wrap">
                    <div className="field-group">
                      <label htmlFor="players">
                        <strong>Number of players:</strong>
                      </label>
                      <input
                        type="number"
                        id="players"
                        name="players"
                        min="2"
                        max="4"
                        value={playersNumber}
                        onChange={(e) => setPlayersNumber(e.target.value)}
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
                        onChange={(e) =>
                          setShotTimer(
                            Math.max(10, Math.min(60, Number(e.target.value)))
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="board-redacting">
            <h1 className="redacting-title">Board Redacting</h1>
            <RedactComponent setShipsPlaced={setShipsPlaced} />
          </div>

          <div className="redacting-btn-wrap">
            {!shipsPlaced ? (
              <div className="redacting-status">
                <p className="anton">Your ships aren`t ready</p>
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

            <button className="btn" onClick={onClose}>
              Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameForm;
