import React from "react";

const GameState = ({ isMyTurn, victory }) => {
  if (victory) {
    return <p className="stats-p">🏆 {victory} wins! 🎉</p>;
  }

  return (
    <div className="stats-p">
      {isMyTurn ? (
        <p>
          What are your waiting for?
          <br />
          Shoot now!
        </p>
      ) : (
        <p>
          Your enemies move
          <br /> Be patient
        </p>
      )}
    </div>
  );
};

export default GameState;
