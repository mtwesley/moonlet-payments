import React from "react";

import { Container } from "react-bootstrap";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Payment from "./Payment";
import Auth from "./Auth";
import { AuthProvider } from "./AuthContext";

function App() {
  const router = createBrowserRouter([
    {
      path: "login/:confirmType?",
      element: <Auth />,
    },
    {
      path: "/:paymentId?",
      element: <Payment />,
    },
  ]);

  return (
    <Container id="app">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Container>
  );
}

export default App;
