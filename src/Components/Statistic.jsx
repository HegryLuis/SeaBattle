import axios from "axios";
import React, { useEffect, useContext, useState } from "react";
import { context } from "../context";
import crown from "./../images/crown.svg";

const Statistic = () => {
  const [stats, setStats] = useState({});
  const { nickname } = useContext(context);
  useEffect(() => {
    axios
      .get(`http://localhost:4001/api/playersStats`)
      .then((res) => {
        const players = res.data;

        // Вычисление winRate и сортировка
        const sorted = players
          .map((player) => ({
            ...player,
            winRate:
              player.totalGames > 0
                ? (player.wins / player.totalGames) * 100
                : 0,
          }))
          .sort((a, b) => b.winRate - a.winRate);

        // Поиск позиции текущего пользователя
        const index = sorted.findIndex((p) => p.username === nickname);

        let me = sorted.find((p) => p.username === nickname);
        me = { ...me, position: index + 1 };

        if (me) setStats(me);
      })
      .catch((err) => {
        console.error("Failed to load players: ", err);
      });
  }, []);

  const getWinRateColor = (rate) => {
    if (rate === undefined || rate === null) return "";
    if (rate < 30) return "winrate-red";
    if (rate < 70) return "winrate-yellow";
    return "winrate-green";
  };

  return (
    <div className="statistic-wrap">
      <div className="statistic-block">
        <h4>Points</h4>

        <div className="statistic-block-content">
          <span>{stats.wins ?? "-"}</span>
        </div>
      </div>
      <div className="statistic-block">
        <h4>Top</h4>
        <div className="statistic-block-content">
          <span>
            {stats.position === 1 ? (
              <img className="statistic-img" alt="crown" src={crown} />
            ) : (
              stats.position ?? "-"
            )}
          </span>
        </div>
      </div>
      <div className="statistic-block">
        <h4>All games</h4>

        <div className="statistic-block-content">
          <span>{stats.totalGames ?? "-"}</span>
        </div>
      </div>
      <div className="statistic-block">
        <h4>% winrate</h4>
        <div
          className={`statistic-block-content ${getWinRateColor(
            stats.winRate
          )}`}
        >
          <span>{stats.winRate ? stats.winRate.toFixed(1) : "-"}</span>
        </div>
      </div>

      <div className="statistic-wl">
        <div className="statistic-wld-header">
          <span className="winrate-green bebasNeue">W</span>
          <span className="slash">/</span>
          <span className="winrate-red bebasNeue">L</span>
        </div>

        <div className="statistic-wld-values">
          <span>{stats.wins}</span>
          <span>{(stats.totalGames ?? 0) - (stats.wins ?? 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default Statistic;
