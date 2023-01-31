import {
  Col,
  Row,
  Card,
  Accordion,
  Table,
  ListGroup,
  Form,
  FormCheck,
  Button,
  Image,
  FloatingLabel,
  Spinner,
  InputGroup,
} from "react-bootstrap";

import { Navigate, useNavigate, useParams } from "react-router-dom";
import { React, useEffect, useState, useCallback } from "react";
import { Alert, CircleInformation } from "grommet-icons";

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";

import ErrorElement from "./Error";
import { useAuthContext } from "./AuthContext";
import { getEmoji } from "./util";

import { dinero, toDecimal, toSnapshot } from "dinero.js";
import { USD, EUR, GBP } from "@dinero.js/currencies";
import { parsePhoneNumber } from "libphonenumber-js";

// const payment = {
//   title: "New Subscription",
//   description: "Payment for increased number of users",
//   instructions: ["Select a payment method"],
//   // method: {
//   //   name: "VISA or Mastercard",
//   //   type: "gtpay",
//   //   description: "Pay with debit or credit VISA or Mastercard",
//   //   redirectUrl: "https://www.gtpay.com/pay",
//   // },
//   // data: {},
//   service: {
//     name: "Subscription",
//     type: "subscription",
//     // description: "",
//     // icon: "",
//     // logo: "",
//   },
//   amount: 60.0,
//   currency: "USD",
//   summary: {
//     items: [
//       { quantity: 2, description: "Service", amount: 20.0 },
//       { quantity: 1, description: "Platform", amount: 5.0 },
//       { quantity: 2, description: "Delivery", amount: 2.5 },
//     ],
//     tax: 5.0,
//     discount: -5.0,
//     fees: 10.0,
//   },
//   reference: "abc123",
//   // values: {},
//   // status: "pending",
// };

const methods = [
  {
    name: "Lonestar MTN Mobile Money",
    type: "mtn-mono-lonestar",
    description: "Pay with Lonestar MTN Mobile Money account",
    redirectUrl: "https://www.lonestarmtn.com/pay",
    form: {},
    status: "active",
    icon: "",
    logo: "",
  },
  {
    name: "VISA or Mastercard",
    type: "gtpay-genesis",
    description: "Pay with debit or credit VISA or Mastercard",
    redirectUrl: "https://www.gtpay.com/pay",
    form: {},
    status: "active",
    icon: "",
    logo: "",
  },
];

const LRD = {
  code: "LRD",
  base: 10,
  exponent: 0,
};

function formatDinero(payment) {
  console.log(payment);
  return toDecimal(dinero(fromPayment(payment)), ({ value, currency }) =>
    Number(value).toFixed(currency.exponent)
  );
}

function fromPayment({ amount, currency }) {
  switch (currency) {
    case "LRD":
      return {
        amount: parseInt(amount),
        currency: LRD,
      };
    case "USD":
      return {
        amount: parseInt(amount * USD.base ** USD.exponent),
        currency: USD,
      };
    case "EUR":
      return {
        amount: parseInt(amount * EUR.base ** EUR.exponent),
        currency: EUR,
      };
    case "GBP":
      return {
        amount: parseInt(amount * GBP.base ** GBP.exponent),
        currency: GBP,
      };
    default:
      return {};
  }
}

export function PaymentList() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  const [copiedLinks, setCopiedLinks] = useState([]);
  const [deleteLinks, setDeleteLinks] = useState([]);

  const navigate = useNavigate();

  const handleCopy = (id) => {
    try {
      navigator.clipboard.writeText(`${window.location.origin}/payment/${id}`);
      setCopiedLinks([...copiedLinks, id]);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handlePayment = (id) => {
    navigate(`/payment/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "payments", id));
    } catch (error) {
      console.error("Failed to delete: ", error);
    }
    setDeleteLinks(deleteLinks.filter((_id) => _id !== id));
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      const items = {};
      getDocs(
        query(
          collection(db, "payments"),
          where("userId", "==", user.uid),
          where("expiresAt", ">", Timestamp.fromMillis(Date.now()))
        )
      ).then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          items[doc.id] = { id: doc.id, ...doc.data() };
        });
        getDocs(
          query(
            collection(db, "payments"),
            where("paymentUserId", "==", user.uid),
            where("expiresAt", ">", Timestamp.fromMillis(Date.now()))
          )
        ).then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            items[doc.id] = { id: doc.id, ...doc.data() };
          });
          const merged = [];
          for (const id in items) {
            if (items.hasOwnProperty(id)) {
              merged.push(items[id]);
            }
          }
          merged.sort((a, b) => a.createdAt - b.createdAt ?? 0);
          setPayments(merged);
          setLoading(false);
        });
      });
    }
  }, [user]);

  return loading ? (
    <Spinner animation="border" className="mx-auto my-5" />
  ) : !payments?.length ? (
    <ErrorElement
      icon={<CircleInformation size="xlarge" />}
      title="No payments"
      message="Payments will appear here when created or assigned to you."
    />
  ) : (
    <>
      <h2>{payments.length ? "All Payments" : "No payments"}</h2>
      {payments &&
        payments.map((payment, index) => {
          return (
            <Card className="mt-2 mb-2" key={payment.id}>
              <Card.Body>
                <Card.Title className="fs-4">{payment.title}</Card.Title>
                <Card.Subtitle className="text-muted mb-2">
                  {formatDinero(payment)} {payment.currency}
                </Card.Subtitle>
                <Card.Text>{payment.description}</Card.Text>
                <Card.Text>
                  {payment.paymentUserId === null ||
                  (payment.paymentUserId === user.uid &&
                    !["accepted", "rejected"].includes(payment.status)) ? (
                    <Button
                      variant="success"
                      size="sm"
                      style={{ marginRight: "1em" }}
                      onClick={() => handlePayment(payment.id)}>
                      Pay now
                    </Button>
                  ) : (
                    <Button
                      variant="dark"
                      size="sm"
                      style={{ marginRight: "1em" }}
                      onClick={() => navigate(`/payment/${payment.id}`)}>
                      {payment.status == "accepted"
                        ? "Payment accepted"
                        : payment.status == "Payment rejected"
                        ? "Unpaid"
                        : "Awaiting payment"}
                    </Button>
                  )}
                  {payment.userId === user.uid &&
                    payment.paymentUserId === null && (
                      <Button
                        variant="danger"
                        size="sm"
                        style={{ marginRight: "1em" }}
                        onClick={() => {
                          if (deleteLinks.includes(payment.id)) {
                            handleDelete(payment.id);
                          } else {
                            setDeleteLinks([...deleteLinks, payment.id]);
                          }
                        }}>
                        {deleteLinks.includes(payment.id)
                          ? "Confirm cancellation"
                          : "Cancel"}
                      </Button>
                    )}
                  {deleteLinks.includes(payment.id) && (
                    <Button
                      variant="dark"
                      size="sm"
                      style={{ marginRight: "1em" }}
                      onClick={() =>
                        setDeleteLinks(
                          deleteLinks.filter((id) => id !== payment.id)
                        )
                      }>
                      Cancel
                    </Button>
                  )}
                  {!["accepted", "rejected"].includes(payment.status) && (
                    <Button
                      variant={
                        copiedLinks.includes(payment.id) ? "dark" : "info"
                      }
                      size="sm"
                      style={{ marginRight: "1em" }}
                      onClick={() => handleCopy(payment.id)}>
                      {copiedLinks.includes(payment.id)
                        ? "Link copied"
                        : "Copy link"}
                    </Button>
                  )}
                </Card.Text>
              </Card.Body>
            </Card>
          );
        })}
    </>
  );
}

export function PaymentCreate() {
  const { user, isAdmin } = useAuthContext();
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0.0);
  const [currency, setCurrency] = useState("USD");

  const handleCreate = async ({ title, description, amount, currency }) => {
    try {
      setStatus("pending");
      const d = dinero(fromPayment({ amount, currency }));
      const sn = toSnapshot(d);
      const ts = Date.now();
      await addDoc(collection(db, "payments"), {
        title,
        description,
        reference: null,
        amount: parseFloat(toDecimal(d)),
        currency: sn.currency.code,
        summary: null,
        userId: user.uid,
        paymentUserId: null,
        values: {},
        method: null,
        status: "pending",
        createdAt: Timestamp.fromMillis(ts),
        updatedAt: Timestamp.fromMillis(ts),
        expiresAt: Timestamp.fromMillis(ts + 48 * 60 * 60 * 1000), // expires in 48 hours
      });
      setStatus("success");
      navigate("/list");
    } catch (error) {
      setStatus("error");
      console.error("Error adding payment: ", error);
    }
  };

  // if (!isAdmin) return <Navigate to="/list" />;

  return (
    <>
      <h2>New Payment</h2>
      <FloatingLabel
        controlId="paymentTitle"
        label="Title"
        className="mb-3 mt-3">
        <Form.Control
          type="text"
          placeholder="Service payment"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
        />
      </FloatingLabel>

      <FloatingLabel
        controlId="paymentDescription"
        label="Description"
        className="mb-3">
        <Form.Control
          as="textarea"
          style={{ height: "120px" }}
          placeholder="Payment for service rendered"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
        />
      </FloatingLabel>

      <InputGroup className="mb-3">
        <FloatingLabel controlId="paymentAmount" label="Amount">
          <Form.Control
            type="number"
            placeholder="0.00"
            onChange={(e) => setAmount(e.target.value)}
            value={amount}
          />
        </FloatingLabel>{" "}
        <Form.Select
          type="text"
          style={{
            maxWidth: "140px",
          }}
          onChange={(e) => setCurrency(e.target.value)}
          value={currency}>
          <option value="LRD">LRD</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </Form.Select>
      </InputGroup>

      <Button
        variant={status === "error" ? "warning" : "info"}
        className="w-100 fs-4 p-3"
        onClick={() => handleCreate({ title, description, amount, currency })}>
        {status === "pending" ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
            <span className="visually-hidden">Creating...</span>
          </>
        ) : status === "success" ? (
          "Payment Created"
        ) : status === "error" ? (
          "Try again"
        ) : (
          "Create"
        )}
      </Button>
    </>
  );
}

export function Payment() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const params = useParams();

  if (!params.paymentId) navigate("/");

  const [payment, setPayment] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [method, setMethod] = useState();

  const assignPayment = async () => {
    setStatus("pending");
    try {
      await updateDoc(doc(db, "payments", params.paymentId), {
        method: method,
        paymentUserId: user.uid,
        updatedAt: Timestamp.fromMillis(Date.now()),
      });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      console.error("Error assigning payment: ", error);
    }
  };

  useEffect(() => {
    if (params.paymentId) {
      setLoading(true);
      onSnapshot(
        doc(db, "payments", params.paymentId),
        (doc) => {
          if (doc.exists()) {
            setPayment({ id: doc.id, ...doc.data() });
          } else {
            setPayment(null);
          }
          setLoading(false);
        },
        (error) => console.log(error)
      );
    }
  }, [params.paymentId]);

  return loading ? (
    <Spinner animation="border" className="mx-auto my-5" />
  ) : !payment ? (
    <ErrorElement
      icon={<Alert size="xlarge" />}
      title="Sorry..."
      message="Payment unavailable or not found"
    />
  ) : (
    <>
      <h2>{payment.title}</h2>
      <h5 className="text-muted">{payment.description}</h5>
      <Card className="bg-dark text-white mt-3">
        <Card.Body>
          <Card.Subtitle className="mb-1 text-muted">Amount Due</Card.Subtitle>
          <h1 className="mb-0 fw-1200">
            {formatDinero(payment)} {payment.currency}
          </h1>
        </Card.Body>
      </Card>
      {payment.summary && <PaymentSummary payment={payment} />}
      <PaymentMethod {...{ payment, method, setMethod }} />
      {!payment.method && (
        <Button
          variant="success"
          type="submit"
          className="w-100 mt-3 fs-4 p-3"
          onClick={assignPayment}>
          {status === "pending" ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="visually-hidden">Assigning...</span>
            </>
          ) : status === "success" ? (
            "Payment Assigned"
          ) : status === "error" ? (
            "Try again"
          ) : (
            "Continue"
          )}
        </Button>
      )}
    </>
  );
}

function PaymentMethod({ payment, method, setMethod }) {
  if (payment.method === "mtn-mono-lonestar")
    return <MTNMomoPayment {...{ payment }} />;
  return (
    <Card variant="info" className="mt-3">
      <Card.Body className="bg-dark">
        <Card.Title className="mb-0 text-white">Payment method</Card.Title>
      </Card.Body>
      <ListGroup variant="flush">
        {methods.map((item, index) => (
          <ListGroup.Item key={index}>
            <FormCheck
              name="method"
              type="radio"
              id={`method-${item.type}`}
              label={item.name}
              value={item.type}
              checked={item.type === method}
              onChange={(e) => setMethod(item.type)}
            />
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

function MTNMomoPayment({ payment }) {
  const [phone, setPhone] = useState(
    payment?.values?.msisdn
      ? parsePhoneNumber(payment.values.msisdn, "LR")?.formatNational()
      : ""
  );
  const [status, setStatus] = useState("");
  const [counter, setCounter] = useState(0);

  const method = {
    name: "Lonestar MTN Mobile Money",
    type: "mtn-mono-lonestar",
    description: "Pay with a mobile money account",
    redirectUrl: "https://www.lonestarmtn.com/pay",
    form: {},
    status: "active",
    icon: "",
    logo: "",
  };

  const processMTNMomoLonestar = httpsCallable(
    functions,
    "processMTNMomoLonestar"
  );

  const checkMTNMomoLonestar = httpsCallable(functions, "checkMTNMomoLonestar");

  const handleProcess = () => {
    try {
      const msisdn = parsePhoneNumber(phone, "LR")?.number.slice(1);

      if (!payment) throw new Error("Payment not found");
      if (!msisdn) throw new Error("Invalid phone number");

      setStatus("pending");
      processMTNMomoLonestar({ payment, msisdn }).then(
        (transactionId) => transactionId && setCounter(60)
      );
    } catch (error) {
      console.log(error);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (["accepted", "rejected"].includes(payment.status)) {
      setStatus("success");
    }

    if (counter > 0) setTimeout(() => setCounter(counter - 1), 1000);
    else if (payment.status === "in-progress") {
      checkMTNMomoLonestar({ payment });
      setCounter(60);
    }

    console.log("counter", counter);
  }, [checkMTNMomoLonestar, counter, payment]);

  return (
    <Card variant="info" className="mt-3">
      <Card.Body className="">
        <Card.Title className="mb-0">{method.name}</Card.Title>
        <Card.Subtitle className="mt-2 text-muted">
          {method.description}
        </Card.Subtitle>
        <InputGroup className="mt-3">
          <Form.Select
            style={{
              maxWidth: "140px",
              paddingRight: "20px",
              paddingLeft: "20px",
            }}
            value="LR"
            disabled>
            <option value="LR">{`${getEmoji("LR")} \xA0 +231`}</option>
          </Form.Select>
          <FloatingLabel label="Phone number" controlId="loginFormInput">
            <Form.Control
              type="input"
              placeholder="yourname@email.com or 0555000000"
              onChange={(e) => setPhone(e.target.value)}
              value={phone}
              disabled={["pending", "success"].includes(status)}
            />
          </FloatingLabel>
        </InputGroup>
        <Button
          variant={
            payment.status === "rejected"
              ? "danger"
              : payment.status === "in-progress"
              ? "warning"
              : "success"
          }
          type="submit"
          className="w-100 mt-3 fs-4 p-3"
          disabled={payment.status !== "pending"}
          onClick={handleProcess}>
          {payment.status === "in-progress" || status === "pending" ? (
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
          ) : payment.status === "accepted" && status === "success" ? (
            "Payment accepted"
          ) : payment.status === "rejected" && status === "success" ? (
            "Payment rejected or cancelled"
          ) : payment.status === "pending" ? (
            status === "error" ? (
              "Try again"
            ) : (
              "Pay now"
            )
          ) : (
            "Pay now"
          )}
        </Button>
      </Card.Body>
    </Card>
  );
}

function PaymentSummary({ payment }) {
  return (
    <Accordion>
      <Accordion.Item eventKey="summary">
        <Accordion.Header>Summary</Accordion.Header>
        <Accordion.Body>
          <Table variant="light" size="sm">
            <thead>
              <tr>
                <th width="60%" className="text-start">
                  Description
                </th>
                <th width="10%" className="text-center">
                  Qty
                </th>
                <th width="30%" className="text-end">
                  Amount ({payment.currency})
                </th>
              </tr>
            </thead>
            <tbody>
              {payment.summary.items.map((item, index) => (
                <tr key={index}>
                  <td className="text-start">{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-end">
                    {toDecimal(
                      dinero(
                        fromPayment({
                          amount: item.amount * item.quantity,
                          currency: payment.currency,
                        })
                      )
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}></td>
              </tr>
              <tr className="fst-italic fw-800">
                <td className="text-start">Sub-Total</td>
                <td className="text-end"></td>
                <td className="text-end">
                  {toDecimal(
                    dinero(
                      fromPayment({
                        amount: payment.summary.items.reduce(
                          (total, item) => total + item.amount * item.quantity,
                          0
                        ),
                        currency: payment.currency,
                      })
                    )
                  )}
                </td>
              </tr>
              {payment.summary.discount && (
                <tr className="fst-italic">
                  <td className="text-start">Discount</td>
                  <td className="text-end"></td>
                  <td className="text-end">
                    {toDecimal(
                      dinero(
                        fromPayment({
                          amount: payment.summary.discount,
                          currency: payment.currency,
                        })
                      )
                    )}
                  </td>
                </tr>
              )}
              {payment.summary.tax && (
                <tr className="fst-italic">
                  <td className="text-start">Tax</td>
                  <td className="text-end"></td>
                  <td className="text-end">
                    {toDecimal(
                      dinero(
                        fromPayment({
                          amount: payment.summary.tax,
                          currency: payment.currency,
                        })
                      )
                    )}
                  </td>
                </tr>
              )}
              {payment.summary.fees && (
                <tr className="fst-italic">
                  <td className="text-start">Fees</td>
                  <td className="text-end"></td>
                  <td className="text-end">
                    {formatDinero({
                      amount: payment.summary.fees,
                      currency: payment.currency,
                    })}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
