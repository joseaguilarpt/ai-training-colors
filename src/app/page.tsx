"use client";

import { useState, useEffect, JSX } from "react";
import { HiColorSwatch } from "react-icons/hi";
import { IoIosSave } from "react-icons/io";
import { MdOutlineColorize } from "react-icons/md";
import {
  FaHeart,
  FaLock,
  FaLockOpen,
  FaMoon,
  FaSave,
  FaSun,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Color from "color";
import { ThemeProvider, useTheme } from "next-themes";

interface ColorPalette {
  colors: string[];
  locked: boolean[];
  id: number;
  name: string;
}

const generateRandomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export function getContrastColor(hex: string): "#000000" | "#ffffff" {
  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "#000000" : "#ffffff";
}

function generateColorPalette(colors?: string[], locked?: boolean[]): string[] {
  const baseColor = generateRandomColor();
  const base = Color(baseColor);

  const variations = [
    base.lighten(0.4).hex(),
    base.lighten(0.2).hex(),
    base.hex(),
    base.darken(0.2).hex(),
    base.darken(0.4).hex(),
  ];

  const complementary = base.rotate(180).hex();
  const resultColors = [...variations, complementary].map((color, index) => {
    if (locked && locked[index]) {
      return colors ? colors[index] : color;
    }
    return color;
  });
  return resultColors;
}

const ThemeProviders = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
};

const HomeInner = (): JSX.Element => {
  const [mounted, setMounted] = useState(false);
  const [colors, setColors] = useState<string[]>(generateColorPalette());
  const [saved, setSaved] = useState<boolean>(false);
  const [locked, setLocked] = useState<boolean[]>(Array(6).fill(false));
  const { theme, setTheme } = useTheme();
  const [savedPalettes, setSavedPalettes] = useState<ColorPalette[]>([]);
  const [favoritePalettes, setFavoritePalettes] = useState<ColorPalette[]>([]);
  const [animate, setAnimate] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("savedPalettes");
    if (saved) {
      setSavedPalettes(JSON.parse(saved));
    }
    const favorites = localStorage.getItem("favoritePalettes");
    if (favorites) {
      setFavoritePalettes(JSON.parse(favorites));
    }
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted && savedPalettes.length > 0) {
      localStorage.setItem("savedPalettes", JSON.stringify(savedPalettes));
    }
  }, [mounted, savedPalettes]);

  useEffect(() => {
    if (mounted && favoritePalettes.length > 0) {
      localStorage.setItem(
        "favoritePalettes",
        JSON.stringify(favoritePalettes)
      );
    }
  }, [mounted, favoritePalettes]);

  const handleGenerate = (): void => {
    setAnimate(true);
    setSaved(false);
    setTimeout(() => {
      const newColors = generateColorPalette(colors, locked);
      setColors(newColors);
      setLocked((prev) => prev.map((isLocked) => isLocked));
      setAnimate(false);
    }, 300);
  };

  const handleLock = (index: number): void => {
    const newLocked = [...locked];
    newLocked[index] = !newLocked[index];
    setLocked(newLocked);
  };

  const handleSave = (): void => {
    const paletteName = `Palette ${savedPalettes.length + 1}`;
    const newPalette = {
      id: crypto.randomUUID(),
      name: paletteName,
      colors,
      locked,
    };
    setSaved(true);
    setSavedPalettes([...savedPalettes, newPalette]);
    toast.success("Palette saved successfully!");
  };

  const handleDelete = (id: number): void => {
    setSaved(false);
    setSavedPalettes((prev) => prev.filter((palette) => palette.id !== id));
    toast.error("Palette deleted!");
  };

  const handleRemoveFavorite = (id: number): void => {
    setSaved(false);
    setFavoritePalettes((prev) => prev.filter((palette) => palette.id !== id));
    toast.error("Palette removed from favorites!");
  };

  const handleFavorite = (palette: ColorPalette): void => {
    const isFavorite = favoritePalettes.some((fav) => fav.id === palette.id);
    if (isFavorite) {
      setFavoritePalettes((prev) =>
        prev.filter((fav) => fav.id !== palette.id)
      );
      toast.error("Removed from favorites!");
    } else {
      setFavoritePalettes((prev) => [...prev, palette]);
      toast.success("Added to favorites!");
    }
  };

  const handleCopy = (color: string): void => {
    navigator.clipboard.writeText(color);
    setCopySuccess(color);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      if (event.code === "Space") {
        event.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [colors, locked]);

  const handleToggleTheme = (): void => {
    const newTheme = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };
  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${
        theme !== "dark"
          ? "from-gray-50 to-gray-100 text-gray-800"
          : "from-black to-gray-800 text-gray-100"
      } transition-colors`}
    >
      <ToastContainer position="bottom-right" />
      <header
        className={`sticky top-0 z-10 ${
          theme !== "dark" ? "bg-white/80" : "bg-gray-900/80"
        } backdrop-blur-sm shadow-sm`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative">
                <h1 className="relative text-2xl font-bold font-roboto bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                  ColorCraft
                </h1>
              </div>
              <p
                className={`ml-4 text-sm ${
                  theme !== "dark" ? "text-gray-500 " : "text-gray-100"
                } hidden md:block`}
              >
                Create beautiful color palettes with AI
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                className="relative group px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-[0_10px_25px_rgba(168,85,247,0.4)] transition-all duration-300 flex items-center space-x-2"
              >
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></span>
                <MdOutlineColorize className="relative z-10" />
                <span className="relative hidden md:block z-10">
                  Generate Palette
                </span>
                <span className="relative block md:hidden z-10">Generate</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleToggleTheme}
                className="relative group px-4 py-2 bg-white dark:bg-gray-800 border border-purple-600 text-purple-600 dark:text-purple-400 rounded-lg shadow-lg hover:shadow-[0_10px_25px_rgba(168,85,247,0.2)] transition-all duration-300 flex items-center space-x-2"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={theme}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {theme === "dark" ? (
                      <FaSun size={20} />
                    ) : (
                      <FaMoon size={20} />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <div className="lg:col-span-1">
            <div className="flex justify-between align-center mb-4 items-center">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <HiColorSwatch className="mr-2 text-purple-600" /> Current
                Palette
              </h2>
              {!saved && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="relative group px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-[0_10px_25px_rgba(168,85,247,0.4)] transition-all duration-300 flex items-center space-x-2"
                >
                  <span className="absolute inset-0 rounded-lg bg-purple-600 opacity-0 group-hover:opacity-10 transition-opacity blur-md"></span>
                  <IoIosSave className="relative z-10" />
                  <span className="relative z-10">Save Palette</span>
                </motion.button>
              )}
            </div>
            <div
              className={` ${
                theme !== "dark" ? "bg-white/90" : "bg-gray-900/90"
              } backdrop-blur-sm rounded-xl shadow-xl p-4 transition-all hover:shadow-lg`}
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-0">
                {colors.map((color, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                      scale: animate ? [1, 1.1, 1] : 1,
                      opacity: 1,
                      backgroundColor: color,
                    }}
                    transition={{
                      duration: animate ? 0.5 : 0.2,
                      delay: index * 0.05,
                    }}
                    whileHover={{ scale: 1.05 }}
                    className={`relative w-full pt-[100%] h-[150px] md:h-[200px] lg:h-[300px] shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
                      locked[index]
                        ? "ring-2 ring-purple-600 dark:ring-purple-400 ring-opacity-50"
                        : ""
                    }`}
                    onClick={() => handleLock(index)}
                  >
                    <div className="group absolute inset-0 flex flex-col items-center justify-center">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          locked[index]
                            ? "bg-purple-600 dark:bg-purple-400"
                            : "bg-white/80 dark:bg-gray-800/80 hidden group-hover:flex"
                        } flex items-center justify-center shadow-md`}
                      >
                        {locked[index] ? (
                          <FaLock className="text-white text-sm" />
                        ) : (
                          <FaLockOpen className="text-purple-600 dark:text-purple-400 text-sm" />
                        )}
                      </div>
                      <div
                        style={{ color: getContrastColor(color) }}
                        className="hidden group-hover:block mt-2 text-xs"
                      >
                        {color}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="mt-2 px-2 py-1 bg-white/80 dark:bg-gray-800/80 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 dark:text-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(color);
                        }}
                      >
                        {copySuccess === color ? "Copied!" : "Copy"}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="lg:col-span-1">
            <div className="flex justify-between mb-4 items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <FaSave className="mr-2 text-purple-600 dark:text-purple-400" />{" "}
                Saved Palettes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {savedPalettes.length}{" "}
                {savedPalettes.length === 1 ? "palette" : "palettes"}
              </p>
            </div>

            {savedPalettes.length === 0 ? (
              <div
                className={` ${
                  theme !== "dark" ? "bg-white/90" : "bg-gray-900/90"
                } backdrop-blur-sm rounded-xl shadow-xl p-6 text-center transition-all hover:shadow-lg`}
              >
                <div className="py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-4">
                    <FaSave className="text-purple-600 dark:text-purple-400 text-3xl" />
                  </div>
                  <p
                    className={`text-lg font-medium ${
                      theme !== "dark" ? "text-gray-600" : "text-gray-300"
                    } mb-2`}
                  >
                    No saved palettes yet
                  </p>
                  <p
                    className={`${
                      theme !== "dark" ? "text-gray-600" : "text-gray-300"
                    } mb-6`}
                  >
                    Generate and save your first palette to see it here
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPalettes.map((palette) => (
                  <motion.div
                    key={palette.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    className={`${
                      theme !== "dark" ? "bg-white/90" : "bg-gray-900/90"
                    } backdrop-blur-sm rounded-xl shadow-xl overflow-hidden transition-all hover:shadow-lg`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="grid grid-cols-3 sm:flex sm:flex-col w-full sm:w-20 divide-x divide-gray-200 dark:divide-gray-700">
                        {palette.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-full h-12 sm:h-20 flex-shrink-0 relative group"
                          >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-mono text-white/90 dark:text-white/90 bg-gray-800/50 px-2 py-1 rounded">
                                {color}
                              </span>
                            </div>
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium truncate">
                            {palette.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleFavorite(palette)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                favoritePalettes.some(
                                  (fav) => fav.id === palette.id
                                )
                                  ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20"
                                  : `${
                                      theme !== "dark"
                                        ? "text-gray-400"
                                        : "text-gray-100"
                                    } hover:bg-gray-100 dark:hover:bg-gray-800`
                              }`}
                            >
                              <FaHeart className="text-sm" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(palette.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            {palette.locked.filter(Boolean).length} locked
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {palette.colors.length} colors
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4 ">
              <h2 className="text-lg font-semibold flex items-center">
                <FaHeart className="mr-2 text-red-600 dark:text-purple-400" />{" "}
                Favorite Palettes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {favoritePalettes.length}{" "}
                {favoritePalettes.length === 1 ? "palette" : "palettes"}
              </p>
            </div>

            {favoritePalettes.length === 0 ? (
              <div
                className={`${
                  theme !== "dark" ? "bg-white/90" : "bg-gray-900/90"
                } backdrop-blur-sm rounded-xl shadow-xl p-6 text-center transition-all hover:shadow-lg`}
              >
                <div className="py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/50 mb-4">
                    <FaHeart className="text-rose-600 dark:text-rose-400 text-3xl" />
                  </div>
                  <p
                    className={`text-lg font-medium ${
                      theme !== "dark" ? "text-gray-600" : "text-gray-300"
                    } mb-2`}
                  >
                    No favorite palettes yet
                  </p>
                  <p
                    className={`${
                      theme !== "dark" ? "text-gray-600" : "text-gray-300"
                    } mb-6`}
                  >
                    Save and favorite palettes to see them here
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoritePalettes.map((palette) => (
                  <motion.div
                    key={palette.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    className={`${
                      theme !== "dark" ? "bg-white/90" : "bg-gray-900/90"
                    } backdrop-blur-sm rounded-xl shadow-xl overflow-hidden transition-all hover:shadow-lg`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="grid grid-cols-3 sm:flex sm:flex-col w-full sm:w-20 divide-x divide-gray-200 dark:divide-gray-700">
                        {palette.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-full h-12 sm:h-20 flex-shrink-0 relative group"
                          >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-mono text-white/90 dark:text-white/90 bg-gray-800/50 px-2 py-1 rounded">
                                {color}
                              </span>
                            </div>
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium truncate">
                            {palette.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleFavorite(palette)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                favoritePalettes.some(
                                  (fav) => fav.id === palette.id
                                )
                                  ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20"
                                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              <FaHeart className="text-sm" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveFavorite(palette.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            {palette.locked.filter(Boolean).length} locked
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {palette.colors.length} colors
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

        body {
          font-family: "Lato", sans-serif;
        }

        .Toastify__toast {
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .Toastify__toast--success {
          background: #6b46c1;
          color: white;
        }

        .Toastify__toast--error {
          background: #e53e3e;
          color: white;
        }

        .Toastify__progress-bar {
          background: rgba(255, 255, 255, 0.3);
        }

        @keyframes pulse-slow {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

const Home = (): JSX.Element => {
  return (
    <ThemeProviders>
      <HomeInner />
    </ThemeProviders>
  );
}

export default Home;

// Zod Schema
export const Schema = {
  commentary: "",
  template: "nextjs-developer",
  title: "Color Scheme Generator",
  description:
    "A color scheme generator that allows users to generate, save, and favorite color palettes.",
  additional_dependencies: [
    "react-icons",
    "framer-motion",
    "react-toastify",
    "color",
    "next-themes",
  ],
  has_additional_dependencies: true,
  install_dependencies_command:
    "npm install react-icons framer-motion react-toastify color next-themes",
  port: 3000,
  file_path: "pages/index.tsx",
  code: "<see code above>",
};
