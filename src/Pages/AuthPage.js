import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { context } from "../context";
import Cookies from "js-cookie";
import ForgotPasswordModal from "../Components/forgotPasswordModal/ForgotPasswordModal";
import { AnimatePresence, motion } from "framer-motion";
import VerificationCodeModal from "../Components/verificationCodeModal/VerificationCodeModal";
import ChangePasswordModal from "../Components/changePasswordModal/ChangePasswordModal";

const AuthPage = () => {
  const [nickname, setNickname] = useState(Cookies.get("nickname") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [hideError, setHideError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const { setIsAuthenticated, setNickname: setGlobalNickname } =
    useContext(context);
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (
      !nickname ||
      !password ||
      (isRegistering && (!email || !confirmPassword))
    ) {
      showError("Please fill in all fields.");
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    const endpoint = isRegistering ? "register" : "login";

    try {
      const payload = isRegistering
        ? { username: nickname, email, password }
        : { username: nickname, password };

      const response = await fetch(
        `http://localhost:4001/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Cookies.set("token", data.token, { expires: 1 });
        Cookies.set("nickname", nickname, { expires: 1 });

        setError("");
        setHideError(false);
        setGlobalNickname(nickname);
        setIsAuthenticated(true);
        navigate("/game");
      } else {
        showError(data.msg || "Authentication failed");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleVerificationRequest = () => {
    setShowModal(false);
    setShowVerificationModal(true);
  };

  const handleVerificationSucceeded = () => {
    setShowVerificationModal(false);
    setShowChangePasswordModal(true);
  };

  const handleBackModal = () => {
    setShowModal(false);
    setShowVerificationModal(false);
    setShowChangePasswordModal(false);
  };

  useEffect(() => {
    if (error) {
      const hideTimeout = setTimeout(() => setHideError(true), 1500);
      const clearTimeoutId = setTimeout(() => setError(null), 2000);

      return () => {
        clearTimeout(hideTimeout);
        clearTimeout(clearTimeoutId);
      };
    }
  }, [error]);

  const showError = (message) => {
    setHideError(false);
    setError(message);
  };

  return (
    <div className="login-page-wrapper">
      <div
        className={`login-page ${
          showModal || showVerificationModal ? "modal-login-page" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          {showModal ? (
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ForgotPasswordModal
                onClose={handleBackModal}
                onSend={handleVerificationRequest}
              />
            </motion.div>
          ) : showVerificationModal ? (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <VerificationCodeModal
                onClose={handleBackModal}
                onSubmit={handleVerificationSucceeded}
              />
            </motion.div>
          ) : showChangePasswordModal ? (
            <motion.div
              key="change-password"
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ChangePasswordModal onClose={handleBackModal} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="bebasNeue">
                {isRegistering ? "Sign Up" : "Log In"}
              </h1>

              <label>
                Nickname
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </label>

              {isRegistering && (
                <label>
                  Email
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              )}

              <label>
                <div className="label-wrap">
                  <p>Password</p>
                  {!isRegistering && (
                    <p
                      onClick={() => setShowModal(true)}
                      className="forgot-password-link"
                    >
                      Forgot?
                    </p>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {isRegistering && (
                <label>
                  Confirm password
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
              )}

              {error && (
                <div className={`auth-error ${hideError ? "hide" : ""}`}>
                  {error}
                </div>
              )}

              <button className="anton" onClick={handleAuth}>
                {isRegistering ? "Sign Up" : "Log In"}
              </button>

              <div className="button-switcher-wrap">
                {isRegistering ? (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => setIsRegistering(false)}>
                      Log In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button onClick={() => setIsRegistering(true)}>
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
