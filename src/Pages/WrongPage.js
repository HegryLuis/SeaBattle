import React from "react";
import { useNavigate } from "react-router-dom";
import "./../App.css";
import GameResults from "../Components/GameResults";

const WrongPage = () => {
  const navigate = useNavigate();
  return (
    <div className="anton wrong-page-wrapper">
      <div className="wrong-page-content">
        <h1>Oops...</h1>
        <h3>Page you want to see does not exist...</h3>
        <h4>Back to main page and try again</h4>

        <button className="btn" onClick={() => navigate("/")}>
          Back to main page
        </button>
      </div>
    </div>
  );
};

export default WrongPage;
