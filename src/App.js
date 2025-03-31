import React, { useContext } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import GamePage from "./Pages/GamePage";
import { context, Provider } from "./context";
import Background from "./Components/Background/Background";
import AuthPage from "./Pages/AuthPage";
import ProtectedRoute from "./hoc/ProtectedRoute";

function App() {
  return (
    <Provider>
      <div className="App">
        <Background />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <LoginPage />{" "}
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:gameID"
              element={
                <ProtectedRoute>
                  <GamePage />{" "}
                </ProtectedRoute>
              }
            ></Route>
            {/* <Route path="/" element={<LoginPage />} /> */}
          </Routes>
        </BrowserRouter>
      </div>
    </Provider>
  );
}

export default App;
