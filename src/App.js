import React, { useEffect } from "react";

import { Container, Image, Nav, NavDropdown, Row, Col } from "react-bootstrap";
import { Outlet, Navigate, useNavigate } from "react-router-dom";

import { useAuthContext } from "./AuthContext";
import { Auth, Login } from "./Auth";
import Header from "./Header";

function App() {
  return (
    <Container id="app">
      <Header />
      <Outlet />
      <Row className="justify-content-center m-3 fs-5 text-muted">
        Made by Moonlet © 2023
      </Row>
    </Container>
  );
}

export default App;
