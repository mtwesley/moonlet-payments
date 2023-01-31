import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function ErrorElement({ icon, title, message, link }) {
  const navigate = useNavigate();

  return (
    <Container>
      <Row className="justify-contents-center">
        <Col xs={12} md={6} className="p-5 text-center">
          {icon}
        </Col>
        <Col xs={12} md={6} className="p-5 text-left">
          <h3>{title}</h3>
          {message && <h5 className="text-muted">{message}</h5>}
          {link && (
            <Button variant="primary" onClick={() => navigate(link)}>
              Go back
            </Button>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ErrorElement;
