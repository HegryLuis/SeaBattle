import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import GamePage from "./Pages/GamePage";
import { Provider } from "./context";
import Background from "./Components/Background/Background";

function App() {
  return (
    <Provider>
      <div className="App">
        <Background />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/game/:gameID" element={<GamePage />}></Route>
          </Routes>
        </BrowserRouter>
      </div>
    </Provider>
  );
}

export default App;
