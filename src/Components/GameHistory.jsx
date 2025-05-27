import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import "../App.css";
import { context } from "../context";

const ITEMS_PER_PAGE = 5;

const GameHistory = ({}) => {
  const { nickname } = useContext(context);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [games, setGames] = useState([]);

  useEffect(() => {
    if (!nickname) return;

    axios
      .get(`http://localhost:4001/api/games?nickname=${nickname}`)
      .then((res) => {
        setGames(res.data);
      })
      .catch((err) => {
        console.error("Failed to load games: ", err);
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

  const totalPages = Math.ceil(sortedGames.length / ITEMS_PER_PAGE);

  const paginatedGames = sortedGames.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // const totalGames = games.length;
  // const totalWins = games.filter((game) => game.winner === nickname).length;
  // {games.length > 0 && (
  //   <p className="game-stats">
  //     Wins: <strong>{totalWins}</strong> / Total Games:{" "}
  //     <strong>{totalGames}</strong>
  //   </p>
  // )}

  return (
    <div className="">
      {games.length === 0 ? (
        <p className="no-games">No games found.</p>
      ) : (
        <>
          <div className="table-container">
            <table className="game-history-table">
              <thead>
                <tr>
                  <th>Players</th>
                  <th onClick={() => requestSort("win")} className="th-sorting">
                    W/L
                  </th>
                  <th
                    onClick={() => requestSort("startedAt")}
                    className="th-sorting"
                  >
                    Date
                  </th>
                  <th
                    onClick={() => requestSort("duration")}
                    className="th-sorting"
                  >
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedGames.map((game) => (
                  <tr key={game._id}>
                    <td>
                      {game.players.map((player, index) => (
                        <span key={index}>
                          {player === nickname ? "You" : player}
                          {index < game.players.length - 1 && ", "}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span
                        style={{
                          color: game.winner === nickname ? "green" : "red",
                        }}
                      >
                        {game.winner === nickname ? "W" : "L"}
                      </span>
                    </td>
                    <td>{new Date(game.startedAt).toLocaleDateString()}</td>
                    <td>
                      {Math.round(
                        (new Date(game.endedAt) - new Date(game.startedAt)) /
                          1000
                      )}{" "}
                      s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <span>
              Page {currentPage} of {totalPages}
            </span>

            <div className="pagination-buttons-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo; Prev
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GameHistory;
