import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { context } from "../context";
import Cookies from "js-cookie";

const AuthPage = () => {
  const [nickname, setNickname] = useState(Cookies.get("nickname") || "");
  const [password, setPassword] = useState("");
  const { setIsAuthenticated, setNickname: setGlobalNickname } =
    useContext(context);
  const navigate = useNavigate();

  const handleLogin = () => {
    // Перевірка на правильність даних (можна зробити більш складну перевірку або інтегрувати API)
    if (nickname && password) {
      Cookies.set("nickname", nickname, { expires: 1 });
      setGlobalNickname(nickname); // Зберігаємо ніком в глобальний контекст
      setIsAuthenticated(true); // Змінюємо статус авторизації
      navigate("/game"); // Переходимо на головну сторінку гри
    } else {
      alert("Please provide valid login credentials.");
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default AuthPage;
