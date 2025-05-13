import { createContext, useState, useEffect } from "react";
import { Board } from "./Models/Board";
import Cookies from "js-cookie";

export const context = createContext();

export const Provider = ({ children }) => {
  const [myBoard, setMyBoard] = useState(new Board());
  const [gameID, setGameID] = useState("");
  const [nickname, setNickname] = useState(Cookies.get("nickname") || "");
  const [enemies, setEnemies] = useState([]); // [{name: Player 2, board : {new Board}, turnIndex: 0}, {...}]
  const [wss, setWss] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState();
  const [turnIndex, setTurnIndex] = useState();
  const [isAuthenticated, setIsAuthenticated] = useState(!!nickname);
  const [globalTurn, setGlobalTurn] = useState(0);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000");

    socket.onopen = () => {
      console.log("✅ WebSocket подключен");
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket ошибка:", error);
    };

    socket.onclose = () => {
      console.warn("🔌 WebSocket закрыт");
    };
    setWss(socket);

    // Закрываем WebSocket при размонтировании
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Обновляем cookies при изменении никнейма
  useEffect(() => {
    if (nickname) {
      Cookies.set("nickname", nickname, { expires: 1 });
    } else {
      Cookies.remove("nickname");
    }
  }, [nickname]);

  const ships = [
    { x: 0, y: 0, size: 4, orientation: "horizontal" },
    { x: 5, y: 5, size: 3, orientation: "horizontal" },
    { x: 5, y: 5, size: 3, orientation: "horizontal" },
    { x: 5, y: 5, size: 2, orientation: "horizontal" },
    { x: 5, y: 5, size: 2, orientation: "horizontal" },
    { x: 5, y: 5, size: 2, orientation: "horizontal" },
    { x: 5, y: 5, size: 1, orientation: "horizontal" },
    { x: 5, y: 5, size: 1, orientation: "horizontal" },
    { x: 5, y: 5, size: 1, orientation: "horizontal" },
    { x: 5, y: 5, size: 1, orientation: "horizontal" },
  ];

  return (
    <context.Provider
      value={{
        nickname,
        setNickname,
        gameID,
        setGameID,
        myBoard,
        setMyBoard,
        ships,
        enemies,
        setEnemies,
        wss,
        isMyTurn,
        setIsMyTurn,
        isAuthenticated,
        setIsAuthenticated,
        turnIndex,
        setTurnIndex,
        globalTurn,
        setGlobalTurn,
      }}
    >
      {children}
    </context.Provider>
  );
};
