import React from "react";
import "./App.css";
import "./Media.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import GamePage from "./Pages/GamePage";
import { Provider } from "./context";
import AuthPage from "./Pages/AuthPage";
import ProtectedRoute from "./hoc/ProtectedRoute";

function App() {
  return (
    <Provider>
      <div className="App">
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
          </Routes>
        </BrowserRouter>
      </div>
    </Provider>
  );
}

export default App;
