"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ModalsContext = createContext();

export const ModalsProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(null);
  const [isProdModalId, setIsProdModalId] = useState(null);
  const [isProd, setIsProd] = useState(null);
  const [isTxt, setIsTxt] = useState({});

  const [activeModalRef, setActiveModalRef] = useState(null);
  const registerModalRef = (ref) => setActiveModalRef(ref);
  const clearModalRef = () => setActiveModalRef(null);

  useEffect(() => {
    const body = document.body;

    const skip = ["language", "sort"];
    const shouldLock = isModalOpen !== null && !skip.includes(isModalOpen);

    if (shouldLock) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }

    return () => {
      body.style.overflow = "";
    };
  }, [isModalOpen]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") setIsModalOpen(null);
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <ModalsContext.Provider
      value={{
        isModalOpen,
        setIsModalOpen,
        isProd,
        setIsProd,
        isProdModalId,
        setIsProdModalId,
        activeModalRef,
        registerModalRef,
        clearModalRef,
        isTxt,
        setIsTxt,
      }}
    >
      {children}
    </ModalsContext.Provider>
  );
};

export const useModals = () => useContext(ModalsContext);

