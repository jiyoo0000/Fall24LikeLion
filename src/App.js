import Login from "./components/auth/login";
import Register from "./components/auth/register";
import Header from "./components/header";
import SocketHome from "./components/socket_home";

import { AuthProvider } from "./contexts/authContext";
import { useRoutes } from "react-router-dom";
import React from "react";
import "./index.css";
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';

function App() {
  const routesArray = [
    {
      path: "*",
      element: <Login />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/sockethome",
      element: <SocketHome />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/search",
      element: <Search />,
    },
  ];
  
  let routesElement = useRoutes(routesArray);

  return (
    <AuthProvider>
      <div className="w-full h-screen flex flex-col">
        {routesElement}
      </div>
    </AuthProvider>
  );
}

export default App;
