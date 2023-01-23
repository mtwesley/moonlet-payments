import {
  Col,
  Row,
  Card,
  Accordion,
  Table,
  ListGroup,
  FormCheck,
  Button,
  Image,
} from "react-bootstrap";

import { Navigate } from "react-router-dom";
import React from "react";

import { useAuthContext } from "./AuthContext";

import { dinero, toDecimal } from "dinero.js";
import { USD } from "@dinero.js/currencies";

const payment = {
  title: "New Subscription",
  description: "Payment for increased number of users",
  instructions: ["Select a payment method"],
  // method: {
  //   name: "VISA or Mastercard",
  //   type: "gtpay",
  //   description: "Pay with debit or credit VISA or Mastercard",
  //   redirectUrl: "https://www.gtpay.com/pay",
  // },
  // data: {},
  service: {
    name: "Subscription",
    type: "subscription",
    // description: "",
    // icon: "",
    // logo: "",
  },
  amount: 60.0,
  currency: "USD",
  summary: {
    items: [
      { quantity: 2, description: "Service", amount: 20.0 },
      { quantity: 1, description: "Platform", amount: 5.0 },
      { quantity: 2, description: "Delivery", amount: 2.5 },
    ],
    tax: 5.0,
    discount: -5.0,
    fees: 10.0,
  },
  reference: "abc123",
  // values: {},
  // status: "pending",
};

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

function fromPayment({ amount, currency }) {
  switch (currency) {
    case "LRD":
      return {
        amount: amount,
        currency: LRD,
      };
    case "USD":
    default:
      return {
        amount: amount * USD.base ** USD.exponent,
        currency: USD,
      };
  }
}

export default function Payment() {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Image id="logo" src="images/payments-logo.png" className="mx-10" />
      <h1>{payment.title}</h1>
      <h5 className="text-muted">{payment.description}</h5>
      <Card className="bg-primary text-white mt-3">
        <Card.Body>
          <Card.Subtitle className="text-muted mb-1">Amount Due</Card.Subtitle>
          <h1 className="mb-0 fw-1200">
            {toDecimal(dinero(fromPayment(payment)))} {payment.currency}
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
                        {toDecimal(
                          dinero(
                            fromPayment({
                              amount: payment.summary.fees,
                              currency: payment.currency,
                            })
                          )
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      )}
      <Card className="mt-3 bg-primary text-white">
        <Card.Body>
          <Card.Title>Payment method</Card.Title>
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
      <Button variant="success" type="submit" className="w-100 mt-3 fs-4">
        Continue
      </Button>
    </>
  );
}
