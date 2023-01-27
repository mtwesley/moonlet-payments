import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Login, Logout } from "./Auth";
import { AuthProvider } from "./AuthContext";
import { Payment, PaymentCreate, PaymentList } from "./Payment";
import App from "./App";

import "bootswatch/dist/lux/bootstrap.min.css";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "login/:confirmType?",
        element: <Login />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "new",
        element: <PaymentCreate />,
      },
      {
        path: "list",
        element: <PaymentList />,
      },
      {
        path: "payment/:paymentId?",
        element: <Payment />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
