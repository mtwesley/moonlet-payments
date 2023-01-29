import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import {
  Auth,
  AuthCheck,
  Login,
  ConfirmEmail,
  ConfirmPhone,
  Logout,
} from "./Auth";
import { AuthProvider } from "./AuthContext";
import { Payment, PaymentCreate, PaymentList } from "./Payment";
import App from "./App";

import "bootswatch/dist/lux/bootstrap.min.css";
import "./index.css";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: "login",
        element: <Auth />,
        children: [
          {
            index: true,
            element: <Login />,
          },
          {
            path: "email",
            element: <ConfirmEmail />,
          },
          {
            path: "phone",
            element: <ConfirmPhone />,
          },
        ],
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        element: <AuthCheck />,
        children: [
          {
            index: true,
            element: <Navigate to="/list" />,
          },
          {
            path: "list",
            element: <PaymentList />,
          },
          {
            path: "new",
            element: <PaymentCreate />,
          },
          {
            path: "payment/:paymentId?",
            element: <Payment />,
          },
        ],
      },
      // {
      //   element; <AuthCheck />,
      //   children: []
      // },
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
