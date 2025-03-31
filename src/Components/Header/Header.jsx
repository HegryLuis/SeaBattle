import React, { useContext, useState } from "react";
import "./Header.css";
import { context } from "../../context";
import { useNavigate } from "react-router-dom";

const Header = ({}) => {
  //   const { setNickname, wss } = useContext(context);
  //   const [isLoggedIn, setIsLoggedIn] = useState(false);
  //   const [modalActive, setModalActive] = useState(false);
  //   const [isChangeModalActive, setIsChangeModalActive] = useState(false);
  //   const [isSignUp, setIsSignUp] = useState(false);
  //   const [username, setUsername] = useState("");
  //   const [password, setPassword] = useState("");
  //   const [error, setError] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const { setIsAuthenticated, setNickname: setGlobalNickname } =
    useContext(context);
  const navigate = useNavigate();

  const handleLogin = () => {
    // Перевірка на правильність даних (можна зробити більш складну перевірку або інтегрувати API)
    if (nickname && password) {
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

  //   return (
  //     <div className="header">
  //       <div className="header-left">
  //         <h1>SEA-BATTLE</h1>
  //       </div>

  //       <div className="header-right">
  //         {isLoggedIn ? (
  //           <div className="greeting">
  //             <p>Hello</p>
  //             <div className="greeting-buttons">
  //               <button className="btn" onClick={() => setIsLoggedIn(false)}>
  //                 Log Out
  //               </button>
  //               <button className="btn" onClick={toggleModal}>
  //                 Change login/password
  //               </button>
  //             </div>
  //           </div>
  //         ) : (
  //           <button className="header-button" onClick={toggleModal}>
  //             Sign up/Log in
  //           </button>
  //         )}
  //       </div>

  //       <div className={`modal ${modalActive ? "active" : ""}`}>
  //         <div className="modal-content">
  //           <button className="close-button" onClick={toggleModal}>
  //             <span>X</span>
  //           </button>

  //           <h6>
  //             <span
  //               onClick={() => {
  //                 setIsSignUp(false);
  //               }}
  //               className={!isSignUp ? "active" : ""}
  //             >
  //               Log in
  //             </span>
  //             <span
  //               onClick={() => {
  //                 setIsSignUp(true);
  //               }}
  //               className={isSignUp ? "active" : ""}
  //             >
  //               Sign up
  //             </span>
  //           </h6>

  //           {isSignUp ? (
  //             <form className="login" onSubmit={handleAuth}>
  //               <input
  //                 type="text"
  //                 placeholder="Enter new username"
  //                 value={username}
  //                 onChange={(e) => setUsername(e.target.value)}
  //               />
  //               <input
  //                 type="password"
  //                 placeholder="Enter new password"
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //               />
  //               <button>Sign up</button>
  //             </form>
  //           ) : (
  //             <form className="login" onSubmit={handleAuth}>
  //               <input
  //                 type="text"
  //                 placeholder="Username"
  //                 value={username}
  //                 onChange={(e) => setUsername(e.target.value)}
  //               />
  //               <input
  //                 type="password"
  //                 placeholder="Password"
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //               />
  //               <button>Log in</button>
  //             </form>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
};

export default Header;
