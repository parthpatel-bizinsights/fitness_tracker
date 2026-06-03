const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "https://6jg8vt57-5173.inc1.devtunnels.ms" ||
      "*",
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Zero-dependency cookie parser middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      if (parts.length >= 2) {
        req.cookies[parts[0].trim()] = parts.slice(1).join("=").trim();
      }
    });
  }
  next();
});

// Routes
app.use("/api", routes);

// Central error handler
app.use(errorHandler);

module.exports = app;
