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

import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

import { useAuthContext } from "./AuthContext";

import { dinero, toDecimal, toSnapshot } from "dinero.js";
import { USD, EUR, GBP } from "@dinero.js/currencies";

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
    name: "MTN Mobile Money",
    type: "lonestar-mtn",
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

  const navigate = useNavigate();

  const handleCopy = (id) => {
    try {
      navigator.clipboard.writeText(
        `${process.env.REACT_APP_ORIGIN}/payment/${id}`
      );
      setCopiedLinks([...copiedLinks, id]);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handlePayment = (id) => {
    navigate(`/payment/${id}`);
  };

  useEffect(() => {
    return () => {
      setLoading(true);
      const q = query(
        collection(db, "payments"),
        where("userId", "==", user.uid)
      );
      onSnapshot(q, (querySnapshot) => {
        const payments = [];
        querySnapshot.forEach((doc) => {
          payments.push({ id: doc.id, ...doc.data() });
        });
        setPayments(payments);
        setLoading(false);
      });
    };
  }, [user]);

  return loading ? (
    <Spinner animation="border" className="mx-auto my-auto" />
  ) : (
    <>
      <h2>All Payments</h2>
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
                  <Button
                    variant="success"
                    size="sm"
                    style={{ marginRight: "1em" }}
                    onClick={() => handlePayment(payment.id)}
                  >
                    Pay now
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    style={{ marginRight: "1em" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={copiedLinks.includes(payment.id) ? "dark" : "info"}
                    size="sm"
                    style={{ marginRight: "1em" }}
                    onClick={() => handleCopy(payment.id)}
                  >
                    {copiedLinks.includes(payment.id)
                      ? "Link copied"
                      : "Copy link"}
                  </Button>
                </Card.Text>
              </Card.Body>
            </Card>
          );
        })}
    </>
  );
}

export function PaymentCreate() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0.0);
  const [currency, setCurrency] = useState("USD");

  const handleCreate = async ({ title, description, amount, currency }) => {
    try {
      setStatus("pending");
      console.log(amount, currency);
      const d = dinero(fromPayment({ amount, currency }));
      const sn = toSnapshot(d);
      await addDoc(collection(db, "payments"), {
        title,
        description,
        amount: parseFloat(toDecimal(d)),
        currency: sn.currency.code,
        userId: user.uid,
      });
      setStatus("success");
      navigate("/list");
    } catch (error) {
      setStatus("error");
      console.error("Error adding payment: ", error);
    }
  };

  return (
    <>
      <h2>New Payment</h2>
      <FloatingLabel
        controlId="paymentTitle"
        label="Title"
        className="mb-3 mt-3"
      >
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
        className="mb-3"
      >
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
          value={currency}
        >
          <option value="LRD">LRD</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </Form.Select>
      </InputGroup>

      <Button
        variant={status === "error" ? "warning" : "info"}
        className="w-100 fs-4 p-3"
        onClick={() => handleCreate({ title, description, amount, currency })}
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

  // useEffect(() => {
  //   return () => {
  //     setLoading(true);
  //     const q = query(
  //       collection(db, "payments"),
  //       where("userId", "==", user.uid)
  //     );
  //     onSnapshot(q, (querySnapshot) => {
  //       const payments = [];
  //       querySnapshot.forEach((doc) => {
  //         payments.push({ id: doc.id, ...doc.data() });
  //       });
  //       setPayments(payments);
  //       setLoading(false);
  //       console.log("Current payments: ", payments);
  //     });
  //   };
  // }, [user]);

  useEffect(() => {
    return () => {
      try {
        setLoading(true);
        onSnapshot(doc(db, "payments", params.paymentId), (doc) => {
          setPayment({ id: doc.id, ...doc.data() });
          setLoading(false);
        });
      } catch (error) {
        console.log(error);
      }
    };
  }, [params.paymentId]);

  return loading ? (
    <Spinner animation="border" className="mx-auto my-auto" />
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
      {payment.summary && (
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
                              (total, item) =>
                                total + item.amount * item.quantity,
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
      )}
      <Card variant="info" className="mt-3  bg-dark">
        <Card.Body>
          <Card.Title className="mb-0 text-white">Payment method</Card.Title>
          {/* <Card.Subtitle className="text-muted">
            Select payment method
          </Card.Subtitle> */}
        </Card.Body>
        <ListGroup variant="flush">
          {methods.map((method, index) => (
            <ListGroup.Item key={index}>
              <FormCheck
                name="method"
                type="radio"
                id={`method-${method.type}`}
                label={method.name}
                value={method.type}
              />
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
      <Button variant="success" type="submit" className="w-100 mt-3 fs-4 p-3">
        Continue
      </Button>
    </>
  );
}
