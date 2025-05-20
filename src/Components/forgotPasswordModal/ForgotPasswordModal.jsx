import React, { useState } from "react";
import "./ForgotPasswordModal.css";
import Cookies from "js-cookie";

const ForgotPasswordModal = ({ onClose }) => {
  const [nickname, setNickname] = useState(Cookies.get("nickname") || "");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSend = async () => {
    setError("");
    if (!email || !nickname) {
      setError("Please fill in both username and email.");
      return;
    }

    try {
      const checkResponse = await fetch(
        "http://localhost:4001/api/auth/check-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: nickname, email }),
        }
      );

      if (!checkResponse.ok) {
        const data = await checkResponse.json();
        setError(data.msg || "Error validating email");
        return;
      }

      //
      const sendResponse = await fetch(
        "http://localhost:4001/api/auth/send-reset-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: nickname, email }),
        }
      );

      if (!sendResponse.ok) {
        const data = await sendResponse.json();
        setError(data.msg || "Error sending reset code");
        return;
      }

      alert(`Reset code sent to ${email}`);
    } catch (error) {
      setError("Network error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="forgot-title">FORGOT PASSWORD?</h2>
        <p className="forgot-description">
          Enter the email address you used when you joined, and we’ll send you a
          code to reset your password. You’ll need to enter this code to
          proceed.
        </p>

        <label>
          <p>Email</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {error && <p className={`auth-error`}>{error}</p>}

        <button onClick={handleSend}>SEND</button>
        <button className="return-btn" onClick={onClose}>
          RETURN
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
