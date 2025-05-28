import React, { useEffect, useState } from "react";

const CircleTimer = ({ timeLeft, duration }) => {
  const radius = 45;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset =
    circumference - (timeLeft / duration) * circumference;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  const getStrokeColor = () => {
    if (timeLeft <= 5) return "#ff4d4d";
    if (timeLeft <= 10) return "#ffa500";
    return "#1e90ff";
  };

  return (
    <div className="timer-wrapper">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#2c2c2c"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getStrokeColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            transition: "stroke-dashoffset 1s linear",
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#fff"
          fontSize="16"
          fontWeight="bold"
        >
          {formatTime(timeLeft)}
        </text>
      </svg>
    </div>
  );
};

export default CircleTimer;
