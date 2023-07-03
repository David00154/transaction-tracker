require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(require("morgan")("combined"));

// middlewares;
app.use(cors());
// EJS
app.use(express.static(path.join(__dirname, "static")));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all("/", (req, res) => res.redirect(302, "/"))

app.get("/", async (req, res) => { });

const port = process.env.PORT || 8080;

try {
  app.listen(port, () => {
    console.log(`> Server started on port ${port}`);
  });
} catch (e) {
  console.log(e);
}

module.exports = app;
