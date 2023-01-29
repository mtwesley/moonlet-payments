import { React, useEffect, useState } from "react";
import {
  Form,
  Button,
  FloatingLabel,
  Spinner,
  InputGroup,
  Collapse,
} from "react-bootstrap";
import { Navigate, useNavigate, useOutletContext } from "react-router";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { useParams, Outlet } from "react-router";
import { isEmail } from "validator";

import { useAuthContext } from "./AuthContext";
import { auth } from "./firebase";

import {
  isValidNumber,
  parsePhoneNumber,
  AsYouType as AsYouTypePhoneNumber,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

export function AuthCheck() {
  const { user } = useAuthContext();

  if (user) return <Outlet />;

  return <Navigate to="/login" />;
}

export function Auth() {
  const { user } = useAuthContext();
  const [confirmation, setConfirmation] = useState();

  if (user) return <Navigate to="/" />;

  return <Outlet context={[confirmation, setConfirmation]} />;
}

export function Login() {
  // const { user } = useAuthContext();
  const navigate = useNavigate();

  const [confirmation, setConfirmation] = useOutletContext();
  const [authInput, setAuthInput] = useState("");
  const [status, setStatus] = useState("");

  // const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  const [phoneCountry, setPhoneCountry] = useState("LR");
  const [isPhoneNumber, setIsPhoneNumber] = useState(false);

  // const { confirmType } = useParams();

  const getEmoji = (countryCode) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // useEffect(() => {
  //   if (user) navigate("/list");
  // }, [user, navigate]);

  useEffect(() => {
    if (authInput.length > 3) {
      const typedNumber = new AsYouTypePhoneNumber(phoneCountry);
      typedNumber.input(authInput);
      if (typedNumber.getNumber()) {
        setIsPhoneNumber(true);
        if (typedNumber.isValid()) {
          setPhoneCountry(typedNumber.getCountry());
        } else if (authInput.indexOf("@") > -1 || authInput.length > 15) {
          setIsPhoneNumber(false);
        }
      } else {
        setIsPhoneNumber(false);
      }
    }
  }, [authInput, phoneCountry]);

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "login-button",
      {
        size: "invisible",
        callback: (response) => {
          // setRecaptchaVerified(true);
        },
      },
      auth
    );
  }, []);

  const handleLogin = (input) => {
    if (!input) return;

    setStatus("pending");
    if (isPhoneNumber) {
      const phone = parsePhoneNumber(authInput, phoneCountry);
      if (phone.isValid()) {
        signInWithPhoneNumber(auth, phone.number, window.recaptchaVerifier)
          .then((confirmationResult) => {
            window.localStorage.setItem("authPhone", phone.number);
            setConfirmation(confirmationResult);
            setStatus("success");
            navigate("/login/phone");
          })
          .catch((error) => {
            console.log("error", error);
            setStatus("error");
          });
      } else {
        setStatus("error");
      }
    } else {
      const email = authInput;
      if (isEmail(email)) {
        sendSignInLinkToEmail(auth, email, {
          url: `${process.env.REACT_APP_ORIGIN}/login/email`,
          handleCodeInApp: true,
        })
          .then(() => {
            window.localStorage.setItem("authEmail", email);
            setStatus("success");
          })
          .catch((error) => {
            console.log("error", error);
            setStatus("error");
          });
      } else {
        setStatus("error");
      }
    }
  };

  useEffect(() => {
    console.log("status", status);
  }, [status]);

  // if (isSignInWithEmailLink(auth, window.location.href))
  //   return <ConfirmEmail {...{ confirmType }} />;

  // if (phoneConfirmation)
  //   return (
  //     <ConfirmPhone
  //       phoneNumber={parsePhoneNumber(authInput, phoneCountry).number}
  //       confirmation={phoneConfirmation}
  //     />
  //   );

  return (
    <>
      {status === "success" && !isPhoneNumber ? (
        <>
          <h1>Thanks!</h1>
          <h5>
            <span className="text-muted">Now click the link sent to: </span>
            {authInput}
          </h5>
        </>
      ) : status === "error" && isPhoneNumber ? (
        <>
          <h1>Sorry...</h1>
          <h5 className="text-muted">Make sure your phone number is valid</h5>
        </>
      ) : status === "error" && !isPhoneNumber ? (
        <>
          <h1>Sorry...</h1>
          <h5 className="text-muted">
            Make sure your email address or phone number is valid
          </h5>
        </>
      ) : (
        <>
          <h1>Welcome</h1>
          <h5 className="text-muted">
            Please enter your email address or phone number
          </h5>
        </>
      )}

      {status !== "success" && (
        <InputGroup className="mt-3">
          <Collapse in={isPhoneNumber} dimension="width">
            <Form.Select
              style={{
                maxWidth: "140px",
                paddingRight: "20px",
                paddingLeft: "20px",
              }}
              value={phoneCountry}
              onChange={(e) => setPhoneCountry(e.target.value)}
            >
              {getCountries().map((country) => (
                <option value={country} key={country}>
                  {`${getEmoji(
                    country.toString()
                  )} \xA0 +${getCountryCallingCode(country)}`}
                </option>
              ))}
            </Form.Select>
          </Collapse>
          <FloatingLabel
            label="Email address or phone number"
            controlId="loginFormInput"
          >
            <Form.Control
              type="input"
              placeholder="yourname@email.com or 0555000000"
              onChange={(e) => setAuthInput(e.target.value)}
              value={authInput}
              disabled={["pending", "success"].includes(status)}
            />
          </FloatingLabel>
        </InputGroup>
      )}

      <Button
        id="login-button"
        variant={status === "error" ? "warning" : "info"}
        className="w-100 mt-3 fs-4 p-3"
        onClick={() => handleLogin(authInput)}
        disabled={["pending", "success"].includes(status)}
      >
        {status === "pending" ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
            <span className="visually-hidden">Sending...</span>
          </>
        ) : status === "success" ? (
          "Email Sent"
        ) : status === "error" ? (
          "Try again"
        ) : (
          "Continue"
        )}
      </Button>
    </>
  );
}

export function ConfirmPhone() {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  const [confirmation] = useOutletContext();

  const handlePhoneConfirmation = (code) => {
    if (!code) return;
    setLoading(true);
    confirmation
      .confirm(code)
      .then((result) => {
        window.localStorage.removeItem("authPhone");
      })
      .catch((error) => {
        console.log("error", error);
      })
      .finally(() => setLoading(false));
  };

  try {
    if (!isValidNumber(window.localStorage.getItem("authPhone")))
      throw new Error("Invalid phone number");
  } catch (error) {
    return <Navigate to="/login" />;
  }

  return loading ? (
    <Spinner animation="border" className="mx-auto my-auto" />
  ) : (
    <>
      <h2>One more step...</h2>
      <h5>
        <span className="text-muted">
          Please enter the verification code sent to:{" "}
        </span>
        {parsePhoneNumber(
          window.localStorage.getItem("authPhone")
        ).formatInternational()}
      </h5>

      <FloatingLabel
        controlId="confirmPhone"
        label="Verification code"
        className="mb-3"
      >
        <Form.Control
          type="text"
          placeholder="123456"
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          value={code}
        />
      </FloatingLabel>

      <Button
        variant="info"
        className="w-100 fs-4 p-3"
        onClick={() => handlePhoneConfirmation(code)}
      >
        Confirm
      </Button>
    </>
  );
}

export function ConfirmEmail() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(window.localStorage.getItem("authEmail"));

  const handleEmailConfirmation = (email) => {
    if (!email) return;
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setLoading(true);
      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          window.localStorage.removeItem("authEmail");
        })
        .catch((error) => {
          console.log("error", error);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    return () =>
      handleEmailConfirmation(window.localStorage.getItem("authEmail"));
  }, []);

  if (!isSignInWithEmailLink(auth, window.location.href))
    return <Navigate to="/login" />;

  return loading ? (
    <Spinner animation="border" className="mx-auto my-auto" />
  ) : (
    <>
      <h2>One more step...</h2>
      <h5 className="text-muted">Please enter your email address again</h5>

      <FloatingLabel
        controlId="confirmEmail"
        label="Email address"
        className="mb-3"
      >
        <Form.Control
          type="email"
          placeholder="Example: yourname@email.com"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          disabled={window.localStorage.getItem("authEmail")}
        />
      </FloatingLabel>

      <Button
        variant="info"
        className="w-100 fs-4 p-3"
        onClick={() => handleEmailConfirmation(email)}
      >
        Confirm
      </Button>
    </>
  );
}

export function Logout() {
  const navigate = useNavigate();
  window.localStorage.removeItem("authEmail");

  useEffect(() => {
    auth.signOut();
    navigate("/");
  }, [navigate]);

  return (
    <>
      <h1>See you next time</h1>
      <h5 className="mt-2">
        <span className="text-muted">
          We hope you enjoyed our service. <br />
          <br />
          For more information contact us at:
        </span>{" "}
        <a href="mailto:info@moonlet.tech">info@moonlet.tech</a>
      </h5>
    </>
  );
}
