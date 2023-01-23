import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "bootswatch/dist/lux/bootstrap.min.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
