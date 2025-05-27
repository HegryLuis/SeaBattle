import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import GamePage from "./Pages/GamePage";
import { Provider } from "./context";
import AuthPage from "./Pages/AuthPage";
import ProtectedRoute from "./hoc/ProtectedRoute";
// import GameHistoryPage from "./Components/GameHistory";

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
            {/* <Route path="/history" element={<GameHistoryPage />} /> */}
          </Routes>
        </BrowserRouter>
      </div>
    </Provider>
  );
}

export default App;
