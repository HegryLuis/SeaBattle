import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { context } from "../context";
import Cookies from "js-cookie";

const AuthPage = () => {
  const [nickname, setNickname] = useState(Cookies.get("nickname") || "");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { setIsAuthenticated, setNickname: setGlobalNickname } =
    useContext(context);
  const navigate = useNavigate();

  const handleAuth = async () => {
    const endpoint = isRegistering ? "register" : "login";

    try {
      const response = await fetch(
        `http://localhost:4001/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: nickname, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Зберігаємо токен і нікнейм
        Cookies.set("token", data.token, { expires: 1 });
        Cookies.set("nickname", nickname, { expires: 1 });

        setGlobalNickname(nickname);
        setIsAuthenticated(true);
        navigate("/game");
      } else {
        alert(data.msg || `${isRegistering ? "Registration" : "Login"} failed`);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="login-page">
      <h1>{isRegistering ? "Register" : "Login"}</h1>
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
      <button onClick={handleAuth}>
        {isRegistering ? "Register" : "Login"}
      </button>
      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? "Switch to Login" : "Switch to Register"}
      </button>
    </div>
  );
};

export default AuthPage;
