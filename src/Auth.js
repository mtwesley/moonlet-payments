import { React, useEffect, useState } from "react";
import { Form, Button, FloatingLabel, Image, Spinner } from "react-bootstrap";

import { useAuthContext } from "./AuthContext";

export default function Auth() {
  const [authEmail, setAuthEmail] = useState(null);
  const [authPhone, setAuthPhone] = useState(null);

  const { user, loading, error } = useAuthContext();

  useEffect(() => {
    window.localStorage.setItem("authEmail", authEmail);
    window.localStorage.setItem("authPhone", authPhone);
  }, [authEmail, authPhone]);

  return <Login />;
}

export function Login() {
  return (
    <>
      <Image id="logo" src="images/payments-logo.png" className="mx-10" />
      <h1>Welcome</h1>
      <h5 className="text-muted">
        Please enter your email address or phone number
      </h5>
      <FloatingLabel
        label="Email address or phone number"
        controlId="loginFormInput"
        className="mb-3 mt-3"
      >
        <Form.Control
          type="input"
          placeholder="yourname@email.com or 0555000000"
        />
      </FloatingLabel>

      <Button variant="info" type="submit" className="w-100 fs-4">
        Continue
        {/* <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
        <span className="visually-hidden">Loading...</span> */}
      </Button>
    </>
  );
}

export function Register() {
  return (
    <>
      <h2>Welcome</h2>
      <h5 className="text-muted">
        Please enter your email address or phone number to continue
      </h5>
      <FloatingLabel
        controlId="registerFormName"
        label="Full name"
        className="mb-3"
      >
        <Form.Control type="input" placeholder="Example: Firstname Lastname" />
      </FloatingLabel>

      <FloatingLabel
        controlId="registerFormPhone"
        label="Phone number"
        className="mb-3"
      >
        <Form.Control type="input" placeholder="Example: 0555000000" />
      </FloatingLabel>

      <FloatingLabel
        controlId="registerFormEmail"
        label="Email address"
        className="mb-3"
      >
        <Form.Control type="email" placeholder="Example: yourname@email.com" />
      </FloatingLabel>

      <Button variant="info" type="submit" className="w-100 fs-4">
        Continue
      </Button>
    </>
  );
}
