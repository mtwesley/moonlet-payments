import React, { useEffect } from "react";

import { Container, Image, Nav, NavDropdown, Row, Col } from "react-bootstrap";
import { Outlet, Navigate, useNavigate } from "react-router-dom";

import { useAuthContext } from "./AuthContext";
import { Auth, Login } from "./Auth";
import Header from "./Header";

function App() {
  const { user } = useAuthContext();

  return (
    <Container id="app">
      <Header />
      <Outlet />
    </Container>
  );
}

export default App;
