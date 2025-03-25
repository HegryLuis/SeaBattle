import React from "react";
import helm from "../../images/helm.png";
import sailingBoat from "../../images/sailing-boat.png";
import ship from "../../images/ship.png";
import "./Background.css";

const Background = () => {
  // Функция для генерации случайных позиций
  const getRandomPosition = () => {
    return {
      top: `${Math.floor(Math.random() * 100)}%`,
      left: `${Math.floor(Math.random() * 100)}%`,
      animationDuration: `${Math.floor(Math.random() * 5 + 20)}s`, // Рандомное время анимации от 5 до 10 секунд
    };
  };

  // Генерация случайных иконок
  const icons = [helm, sailingBoat, ship];
  const numIcons = 10; // Количество иконок в фоне
  const iconElements = [];

  for (let i = 0; i < numIcons; i++) {
    const icon = icons[i % icons.length];
    const randomPosition = getRandomPosition();
    iconElements.push(
      <img
        key={i}
        src={icon}
        className="overlay"
        style={{
          ...randomPosition,
          animationName: "moveInCircle",
        }}
        alt="icon"
      />
    );
  }

  return <div className="background">{iconElements}</div>;
};

export default Background;
