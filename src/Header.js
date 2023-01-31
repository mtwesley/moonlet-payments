import React from "react";

import { Container, Image, Nav, NavDropdown, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { parsePhoneNumber } from "libphonenumber-js";

import { Menu } from "grommet-icons";
import { useAuthContext } from "./AuthContext";

export default function Header() {
  const { user, isAdmin } = useAuthContext();

  return (
    <header className="d-flex mb-4 align-items-center">
      <section>
        <Link to="/">
          <Image id="logo" src="/images/payments-logo.png" />
        </Link>
      </section>

      {user && (
        <Nav
          id="navbar"
          className="justify-content-end ms-auto flex-shrink-0 align-items-center">
          <NavDropdown
            title={<Menu size="medium" className="fs-1" />}
            id="nav-dropdown"
            style={{ marginRight: 0 }}>
            {/* {isAdmin && ( */}
            <NavDropdown.Item
              as={Link}
              to="/new"
              className="text-decoration-none">
              Create payment
            </NavDropdown.Item>
            {/* )} */}
            <NavDropdown.Item
              as={Link}
              to="/list"
              className="text-decoration-none">
              List payments
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item
              as={Link}
              to="/logout"
              className="text-decoration-none">
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      )}

      {/* <IoMenuSharp className="fs-1 align-self-center ms-auto flex-shrink-0" />
        <IoMenuSharp className="fs-1 align-self-center ms-auto flex-shrink-0" /> */}
      {/* <IoMenuSharp className="fs-1 align-self-center ms-auto flex-shrink-0" /> */}
      {/* <i className="ri-menu-fill fs-2"></i> */}
      {/* <i className="ri-menu-fill fs-2 align-self-center ms-auto flex-shrink-0"></i> */}
    </header>
  );
}
