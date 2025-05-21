import React, { useRef, useState } from "react";
import "./VerificationCodeModal.css";
import Cookies from "js-cookie";

const VerificationCodeModal = ({ onSubmit, onClose }) => {
  const [code, setCode] = useState(Array(6).fill(""));
  const [nickname, setNickname] = useState(Cookies.get("nickname") || "");
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullCode = code.join("");
    if (fullCode.length === 6) {
      try {
        const res = await fetch(
          "http://localhost:4001/api/auth/verify-reset-code",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: nickname, code: fullCode }),
          }
        );

        const data = await res.json();

        if (res.ok) {
          alert("Code verified successfully!");
          onSubmit(fullCode);
        } else {
          alert(data.msg || "Invalid code");
        }
      } catch (error) {
        console.error("Verification failed", error);
        alert("Something went wrong...");
      }
    }
  };

  return (
    <>
      <form className="code-form" onSubmit={handleSubmit}>
        <h2>ENTER VERIFICATION CODE</h2>
        <p>
          Enter the 6-digit code we sent to your email address to reset your
          password. If you didn’t receive the code, you can request a new one.
        </p>
        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              placeholder="X"
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputsRef.current[index] = el)}
            />
          ))}
        </div>
        <button type="submit">SEND</button>
      </form>
      <button className="return-btn" onClick={onClose}>
        RETURN
      </button>
    </>
  );
};

export default VerificationCodeModal;
