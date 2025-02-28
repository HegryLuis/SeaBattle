import React from "react";

const GameState = ({ canShoot = false, ready }) => {
  return (
    <div>
      {canShoot ? (
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
