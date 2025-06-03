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
                    <div className="generate-id-wrap-block">
                      <button
                        className="btn-gen"
                        onClick={(e) => {
                          e.preventDefault();
                          setGameID(uuidv4());
                        }}
                      >
                        Generate
                      </button>
                    </div>
                    <div className="generate-id-wrap-block">
                      <h4>Generated ID: </h4>
                      <span
                        className="generated-id"
                        onClick={() => copyToClipboard(gameID)}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        {gameID || (
                          <span className="placeholder">Click "Generate"</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="field-group-wrap">
                    <div className="field-group">
                      <label htmlFor="players">
                        <strong>Number of players:</strong>
                      </label>
                      <select
                        id="players"
                        name="players"
                        value={playersNumber}
                        onChange={(e) =>
                          setPlayersNumber(Number(e.target.value))
                        }
                        className="players-select"
                      >
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor="timer">
                        <strong>Time per shot (seconds):</strong>
                      </label>
                      <select
                        id="timer"
                        name="timer"
                        value={shotTimer}
                        onChange={(e) => setShotTimer(Number(e.target.value))}
                        className="players-select"
                      >
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                        <option value="60">60</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
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

          <div className="board-redacting">
            <RedactComponent setShipsPlaced={setShipsPlaced} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameForm;
