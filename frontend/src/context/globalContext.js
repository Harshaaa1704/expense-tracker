import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast, Toaster } from "react-hot-toast";

const BASE_URL = process.env.REACT_APP_API_BASE_URL; // e.g. https://spendx-z7ag.onrender.com/api/v1/

const GlobalContext = React.createContext();

export const GlobalProvider = ({ children }) => {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");

  const [cookies, setCookie, removeCookie] = useCookies(["jwt"]);
  const navigate = useNavigate();

  // ---------- AUTH: LOGIN ----------
  const login = async (values) => {
    try {
      const { data } = await axios.post(
        `${BASE_URL}login`,
        values,
        { withCredentials: true }
      );

      if (data?.errors) {
        setError(data.errors.email || data.errors.password || "Login failed");
        return;
      }

      setUser(data.user || null);
      setName(data.user?.name || "");
      toast.success("Login Successful!");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    }
  };

  // ---------- AUTH: REGISTER ----------
  const register = async (values) => {
    try {
      const { data } = await axios.post(
        `${BASE_URL}register`,
        values,
        { withCredentials: true }
      );

      if (data?.errors) {
        setError(data.errors.email || data.errors.password || "Registration failed");
        return;
      }

      setUser(data.user || null);
      setName(data.user?.name || "");
      toast.success("Registration Successful!");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Registration failed. Please try again.");
    }
  };

  // ---------- AUTH: CHECK USER (on refresh / app start) ----------
  const checkUser = async () => {
    try {
      // If no jwt cookie exists locally, treat as not logged in
      if (!cookies?.jwt) {
        setUser(null);
        return;
      }

      // IMPORTANT: your backend must have this endpoint:
      // GET or POST -> /api/v1/check-user (adjust if your backend differs)
      const { data } = await axios.get(`${BASE_URL}check-user`, {
        withCredentials: true,
      });

      if (data?.status) {
        setUser(data.user || null);
        setName(data.user?.name || "");
      } else {
        setUser(null);
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setUser(null);
      navigate("/login");
    }
  };

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookies?.jwt]);

  // When user is set (logged in), load their data
  useEffect(() => {
    if (user) {
      fetchIncomes();
      fetchExpenses();
    } else {
      setIncomes([]);
      setExpenses([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------- AUTH: SIGN OUT ----------
  const signOutUser = () => {
    // remove cookie (backend should also clear it ideally)
    removeCookie("jwt", { path: "/" });
    setUser(null);
    setName("");
    navigate("/login");
  };

  // ---------- INCOMES ----------
  const addIncome = async (income) => {
    try {
      await axios.post(`${BASE_URL}add-income`, income, { withCredentials: true });
      fetchIncomes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add income.");
    }
  };

  const fetchIncomes = async () => {
    try {
      if (!user?._id) return;
      const response = await axios.get(
        `${BASE_URL}get-incomes?userid=${user._id}`,
        { withCredentials: true }
      );
      setIncomes(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load incomes.");
    }
  };

  const deleteIncome = async (id) => {
    try {
      await axios.delete(`${BASE_URL}delete-income/${id}`, { withCredentials: true });
      fetchIncomes();
    } catch (err) {
      console.error(err);
      setError("Failed to delete income.");
    }
  };

  const totalIncome = () =>
    incomes.reduce((sum, income) => sum + (Number(income?.amount) || 0), 0);

  // ---------- EXPENSES ----------
  const addExpense = async (expense) => {
    try {
      await axios.post(`${BASE_URL}add-expense`, expense, { withCredentials: true });
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add expense.");
    }
  };

  const fetchExpenses = async () => {
    try {
      if (!user?._id) return;
      const res = await axios.get(
        `${BASE_URL}get-expenses?userid=${user._id}`,
        { withCredentials: true }
      );
      setExpenses(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load expenses.");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${BASE_URL}delete-expense/${id}`, { withCredentials: true });
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setError("Failed to delete expense.");
    }
  };

  const totalExpenses = () =>
    expenses.reduce((sum, expense) => sum + (Number(expense?.amount) || 0), 0);

  const totalBalance = () => totalIncome() - totalExpenses();

  const transactionHistory = () => {
    const history = [...incomes, ...expenses].filter(Boolean);
    history.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    return history.slice(0, 3);
  };

  // ---------- TOAST HANDLING ----------
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  return (
    <GlobalContext.Provider
      value={{
        // auth
        user,
        name,
        login,
        register,
        checkUser,
        signOutUser,

        // state + setters (setError is restored so your other files won't crash)
        error,
        setError,

        // incomes
        incomes,
        addIncome,
        fetchIncomes,
        deleteIncome,
        totalIncome,

        // expenses
        expenses,
        addExpense,
        fetchExpenses,
        deleteExpense,
        totalExpenses,

        // computed
        totalBalance,
        transactionHistory,
      }}
    >
      {children}

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
          success: { duration: 3000, theme: { primary: "green", secondary: "black" } },
          error: {
            duration: 3000,
            theme: { primary: "red", secondary: "black" },
            closeOnClick: true,
          },
        }}
      />
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
