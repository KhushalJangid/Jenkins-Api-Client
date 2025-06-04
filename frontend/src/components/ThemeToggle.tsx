// ThemeToggle.js
import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Asleep, Awake } from "@carbon/icons-react/lib/generated/bucket-1";

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  if (theme === "light") {
    return <Asleep className="my-auto mx-3" role="button" size={20} onClick={toggleTheme} />;
  } else {
    return <Awake className="my-auto mx-3" role="button" size={20} onClick={toggleTheme} />;
  }
}

const applyTheme = () => {
  const theme = localStorage.getItem("theme") || "light";

  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
};

const getTheme = () => {
  return localStorage.getItem("theme") || "light";
};

export default ThemeToggle;
export { applyTheme, getTheme };
