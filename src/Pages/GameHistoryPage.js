import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "../App.css";
import { context } from "../context";
import { useNavigate } from "react-router-dom";

const GameHistoryPage = () => {
  const navigate = useNavigate();
  const { nickname } = useContext(context);
  const [games, setGames] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    if (!nickname) return;

    axios
      .get(`http://localhost:4001/api/games?nickname=${nickname}`)
      .then((res) => {
        setGames(res.data);
      })
      .catch((err) => {
        console.error("Failed to load games", err);
      });
  }, [nickname]);

  const sortedGames = [...games].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const { key, direction } = sortConfig;

    let aVal, bVal;

    if (key === "duration") {
      aVal = new Date(a.endedAt) - new Date(a.startedAt);
      bVal = new Date(b.endedAt) - new Date(b.startedAt);
    } else if (key === "win") {
      aVal = a.winner === nickname ? 1 : 0;
      bVal = b.winner === nickname ? 1 : 0;
    } else {
      aVal = new Date(a[key]);
      bVal = new Date(b[key]);
    }

    return direction === "asc" ? aVal - bVal : bVal - aVal;
  });

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="history-page">
      <h1>Game History</h1>
      {games.length === 0 ? (
        <p className="no-games">No games found.</p>
      ) : (
        <div className="table-container">
          <table className="game-history-table">
            <thead>
              <tr>
                <th>Game ID</th>
                <th>Players</th>
                <th onClick={() => requestSort("win")} className="th-sorting">
                  Winner{" "}
                  {sortConfig.key === "win"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  onClick={() => requestSort("startedAt")}
                  className="th-sorting"
                >
                  Start{" "}
                  {sortConfig.key === "startedAt"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  onClick={() => requestSort("endedAt")}
                  className="th-sorting"
                >
                  End{" "}
                  {sortConfig.key === "endedAt"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  onClick={() => requestSort("duration")}
                  className="th-sorting"
                >
                  Duration{" "}
                  {sortConfig.key === "duration"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedGames.map((game) => (
                <tr key={game._id}>
                  <td>{game.gameID}</td>
                  <td>
                    {game.players.map((player, index) => (
                      <span
                        key={index}
                        style={{
                          color: player === nickname ? "blue" : "inherit",
                        }}
                      >
                        {player}
                        {index < game.players.length - 1 && ", "}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span
                      style={{
                        color: game.winner === nickname ? "blue" : "inherit",
                      }}
                    >
                      {game.winner}
                    </span>
                  </td>
                  <td>{new Date(game.startedAt).toLocaleString()}</td>
                  <td>{new Date(game.endedAt).toLocaleString()}</td>
                  <td>
                    {Math.round(
                      (new Date(game.endedAt) - new Date(game.startedAt)) / 1000
                    )}{" "}
                    s
                  </td>
                  <td>
                    <button
                      className="view-logs-btn"
                      onClick={() => console.log("View logs:", game.logs)}
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={() => {
          navigate("/game");
        }}
      >
        RETURN
      </button>
    </div>
  );
};

export default GameHistoryPage;
