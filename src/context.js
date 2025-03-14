import { createContext, useState, useEffect } from "react";
import { Board } from "./Models/Board";

export const context = createContext();

export const Provider = ({ children }) => {
  const [myBoard, setMyBoard] = useState(new Board());
  const [gameID, setGameID] = useState("");
  const [nickname, setNickname] = useState("");
  const [enemyName, setEnemyName] = useState("");
  const [wss, setWss] = useState(null); // Здесь храните WebSocket

  useEffect(() => {
    // Создаем WebSocket один раз при монтировании компонента
    const socket = new WebSocket("ws://localhost:4000");
    setWss(socket);

    // Закрываем WebSocket при размонтировании
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      // socket.close();
    };
  }, []);

  const ships = [
    { x: 0, y: 0, size: 4, orientation: "horizontal" },
    { x: 5, y: 5, size: 3, orientation: "horizontal" },
    { x: 8, y: 3, size: 3, orientation: "vertical" },
  ];
  // const ctx = useContext(context);
  // if (!ctx) throw new Error("This hook should be used inside App component");

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
      }}
    >
      {children}
    </context.Provider>
  );
};

// export const { Provider } = context;
