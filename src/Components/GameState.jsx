import React, { useContext } from "react";
import { context } from "../context";

const GameState = ({ isMyTurn, victory }) => {
  const { nickname } = useContext(context);
  if (victory) {
    return (
      <p className="stats-p">
        {nickname === victory ? "🏆 You win! 🎉" : `${victory} won`}
      </p>
    );
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
