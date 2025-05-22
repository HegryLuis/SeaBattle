import React, { useState } from "react";
import Cookies from "js-cookie";

const ChangePasswordModal = ({ onClose }) => {
  const [nickname, setNickname] = useState(Cookies.get("nickname") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (loading) return;

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:4001/api/auth/change-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: nickname, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Failed to change password");
        return;
      }

      alert("Password changed successfully!");
      onClose();
    } catch (error) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="forgot-title">NEW PASSWORD</h2>
        <label>
          <p>New password</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {error && <p className={`auth-error`}>{error}</p>}

        <button onClick={handleSend} disabled={loading}>
          {loading ? "SAVING..." : "CONFIRM"}
        </button>
        <button className="return-btn" onClick={onClose}>
          RETURN
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
