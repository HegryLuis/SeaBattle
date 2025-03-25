import { createContext, useState, useEffect } from "react";
import { Board } from "./Models/Board";

export const context = createContext();

export const Provider = ({ children }) => {
  const [myBoard, setMyBoard] = useState(new Board());
  const [gameID, setGameID] = useState("");
  const [nickname, setNickname] = useState("");
  const [enemyName, setEnemyName] = useState("");
  const [wss, setWss] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState();

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000");
    setWss(socket);

    // Закрываем WebSocket при размонтировании
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

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
        enemyName,
        setEnemyName,
        wss,
        isMyTurn,
        setIsMyTurn,
      }}
    >
      {children}
    </context.Provider>
  );
};
