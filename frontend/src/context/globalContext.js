import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast, Toaster } from "react-hot-toast";

// Use the deployed backend URL
const BASE_URL = process.env.REACT_APP_API_BASE_URL; // e.g., https://spendx-z7ag.onrender.com/api/v1/

const GlobalContext = React.createContext();

export const GlobalProvider = ({ children }) => {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [cookies, setCookie, removeCookie] = useCookies([]);
  const navigate = useNavigate();

  // ===== LOGIN =====
  const login = async (values) => {
    try {
      const { data } = await axios.post(`${BASE_URL}login`, values, {
        withCredentials: true,
      });

      if (data.errors) {
        setError(data.errors.email || data.errors.password);
      } else {
        setUser(data.user);
        setName(data.user.name || "");
        toast.success("Login Successful!");
        navigate("/"); // redirect to dashboard
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    }
  };

  // ===== REGISTER =====
  const register = async (values) => {
    try {
      const { data } = await axios.post(`${BASE_URL}register`, values, {
        withCredentials: true,
      });

      if (data.errors) {
        setError(data.errors.email || data.errors.password);
      } else {
        setUser(data.user);
        setName(data.user.name || "");
        toast.success("Registration Successful!");
        navigate("/"); // redirect to dashboard
      }
    } catch (err) {
      console.error(err);
      toast.error("Registration failed. Please try again.");
    }
  };

  // ===== CHECK USER AUTH =====
  const checkUser = async () => {
    try {
      if (!cookies.jwt) {
        setUser(null);
        return;
      }

      const { data } = await axios.get(`${BASE_URL}check-user`, {
        withCredentials: true,
      });

      if (data.status) {
        setUser(data.user);
        setName(data.user.name || "");
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
  }, [cookies]);

  useEffect(() => {
    if (user) {
      fetchIncomes();
      fetchExpenses();
    }
  }, [user]);

  // ===== SIGN OUT =====
  const signOutUser = () => {
    removeCookie("jwt", { path: "/" });
    setUser(null);
    navigate("/login");
  };

  // ===== INCOME FUNCTIONS =====
  const addIncome = async (income) => {
    try {
      await axios.post(`${BASE_URL}add-income`, income, {
        withCredentials: true,
      });
      fetchIncomes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add income.");
    }
  };

  const fetchIncomes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}get-incomes?userid=${user?._id}`, {
        withCredentials: true,
      });
      setIncomes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteIncome = async (id) => {
    try {
      await axios.delete(`${BASE_URL}delete-income/${id}`, {
        withCredentials: true,
      });
      fetchIncomes();
    } catch (err) {
      console.error(err);
    }
  };

  const totalIncome = () =>
    incomes.reduce((sum, income) => sum + income.amount, 0);

  // ===== EXPENSE FUNCTIONS =====
  const addExpense = async (expense) => {
    try {
      await axios.post(`${BASE_URL}add-expense`, expense, {
        withCredentials: true,
      });
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add expense.");
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}get-expenses?userid=${user?._id}`, {
        withCredentials: true,
      });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${BASE_URL}delete-expense/${id}`, {
        withCredentials: true,
      });
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpenses = () =>
    expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const totalBalance = () => totalIncome() - totalExpenses();

  const transactionHistory = () => {
    const history = [...incomes, ...expenses];
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return history.slice(0, 3);
  };

  // ===== ERROR TOAST =====
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  return (
    <GlobalContext.Provider
      value={{
        user,
        name,
        incomes,
        expenses,
        error,
        login,
        register,
        signOutUser,
        addIncome,
        fetchIncomes,
        deleteIncome,
        totalIncome,
        addExpense,
        fetchExpenses,
        deleteExpense,
        totalExpenses,
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
        }}
      />
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
