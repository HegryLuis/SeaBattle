import React, { useState, useEffect } from "react";
import axios from "axios";
import crown from "./../images/crown.svg";

const Leaderboard = ({}) => {
  const [playersStats, setPlayersStats] = useState([]);
  const [renderStats, setRenderStats] = useState([]);

  const getWinRateColor = (rate) => {
    if (rate === undefined || rate === null) return "";
    if (rate < 30) return "winrate-red";
    if (rate < 70) return "winrate-yellow";
    return "winrate-green";
  };

  useEffect(() => {
    axios
      .get(`http://localhost:4001/api/playersStats`)
      .then((res) => {
        setPlayersStats(res.data);
      })
      .catch((err) => {
        console.error("Failed to load players: ", err);
      });
  }, []);

  useEffect(() => {
    if (playersStats.length > 0) {
      const stats = playersStats
        .map((player) => ({
          nickname: player.username,
          percent: player.totalGames > 0 ? player.wins / player.totalGames : 0,
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 10);

      setRenderStats(stats);
    }
  }, [playersStats]);

  return (
    <div className="leaderboard-table-wrapper">
      {renderStats.map((stats, index) => {
        return (
          <div key={index} className="leaderboard-block-content">
            <div className="leaderboard-nickname-wrap">
              <div className="leaderboard-num">
                {index === 0 ? <img alt="crown" src={crown} /> : index + 1}
              </div>
              <div className="anton">{stats.nickname}</div>
            </div>
            <div className={` ${getWinRateColor(stats.percent * 100)}`}>{`${(
              stats.percent * 100
            ).toFixed(1)}%`}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Leaderboard;
