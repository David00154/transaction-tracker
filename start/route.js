require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const flash = require("connect-flash")

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

app.use((session({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 2 * 24 * 60 * 60 * 1000 },
})))

app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.all("/", (req, res) => res.redirect(302, "/track"))

app.get("/track", async (req, res) => {
  const tracking_code = req.query['tracking_code']
  res.render("track", { layout: "layouts/default", tracking_code: tracking_code ?? "" })
});

app.use("/admin", express
  .Router()
  .get("/create", async (req, res) => {
    try {

      res.render("create_code", {
        layout: "layouts/admin",//
        title: "Create Tracking Code",
        tracking_code: []
      })
    } catch (error) {
      console.log(error)
      res.render("create_code", {
        layout: "layouts/admin",//
        title: "Create Tracking Code",
        tracking_code: []
      })
    }
  }))


const port = process.env.PORT || 8080;

try {
  app.listen(port, () => {
    console.log(`> Server started on port ${port}`);
  });
} catch (e) {
  console.log(e);
}

module.exports = app;
