import React, { useEffect, useState } from "react";
import AuthLeftSide from "../ui/AuthLeftSide";
import AuthForm from "../ui/AuthForm";

const AuthContainer = () => {
  const [animate, setAnimate] = useState(false);
  const [animateSecond, setAnimateSecond] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimate(true), 1000); // небольшая задержка
    return () => clearTimeout(timeout);
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => setAnimateSecond(true), 2000); // небольшая задержка
    return () => clearTimeout(timeout);
  }, []);

  const style1 = {
    width: !animate ? "100%" : "60%",
    transition: "all 2.8s ease",
  };
  const style2 = {
    width: !animate ? "0px" : "40%",
    transition: "all 2.8s ease",
    padding: !animate ?"0":"65px",
    opacity: animate ? 1 : 0,
  };
const styleTXT = {
  transition: "opacity 1.5s ease, transform 1.5s ease", // плавный переход
  opacity: animateSecond ? 1 : 0,                      // плавное появление
  transform: animateSecond ? "translateY(0)" : "translateY(-5px)", // лёгкий сдвиг
  visibility: animateSecond ? "visible" : "hidden",    // скрытие без резкого эффекта
};


  return (
    <div className="auth">
      <AuthLeftSide style1={style1} />
      <AuthForm  style2={style2} styleTXT={styleTXT}/>
    </div>
  );
};

export default AuthContainer;
