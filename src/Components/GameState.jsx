import React from "react";

const GameState = ({ isMyTurn }) => {
  return (
    <div>
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
