import React from "react";
import golden_star from "./../images/golden_star.svg";
import golden_crown from "./../images/golden_crown.svg";
import sad_smile from "./../images/sad_smile.svg";
import { useNavigate } from "react-router-dom";

const GameResults = ({ result }) => {
  const navigate = useNavigate();
  const isWin = result === "win";

  return (
    <div className="results-box-wrapper">
      <div className="results-box-container">
        <div className="winner-box-top">
          <img
            className="results-main-logo"
            alt={isWin ? "crown" : "sad face"}
            src={isWin ? golden_crown : sad_smile}
          />
          {isWin && (
            <>
              <img
                className="winner-star winner-star-1"
                alt="star"
                src={golden_star}
              />
              <img
                className="winner-star winner-star-2"
                alt="star"
                src={golden_star}
              />
              <img
                className="winner-star winner-star-3"
                alt="star"
                src={golden_star}
              />
              <img
                className="winner-star winner-star-4"
                alt="star"
                src={golden_star}
              />
            </>
          )}
        </div>

        <div className="winner-box-content">
          <h1 className="anton">{isWin ? "YOU WIN!" : "YOU LOOSE!"}</h1>

          <div className="results-btn-wrap">
            <button className="btn anton" onClick={() => navigate("/game")}>
              Play again
            </button>
            <button className="btn anton" onClick={() => navigate("/")}>
              Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
