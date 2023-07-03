require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const flash = require("connect-flash");
const { prisma, generateTrackingCode } = require("../utils")

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
      let codes = await prisma.transaction.findMany({
        select: {
          name: true,
          tracking_number: true,
          status_point: {
            where: {
              active: true
            },
            select: {
              status: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })
      res.render("create_code", {
        layout: "layouts/admin",//
        title: "Create Tracking Code",
        tracking_code: codes
      })
    } catch (error) {
      console.log(error)
      res.render("create_code", {
        layout: "layouts/admin",//
        title: "Create Tracking Code",
        tracking_code: []
      })
    }
  })
  .post("/generate_code", async (req, res, next) => {
    try {
      const { name } = req.body
      if (name == "" || name == undefined) {
        req.flash("error", "The identification name is required")
        res.redirect(302, "/admin/create")
      } else {
        const trackingCode = generateTrackingCode();
        let transaction = await prisma.transaction.create({
          data: {
            tracking_number: trackingCode,
            name
          }
        })
        let status_point = await prisma.statusPoint.createMany({
          data: [
            {
              transactionId: transaction.id, // 
              status: "Pending",
              active: true
            },
            {
              transactionId: transaction.id, // 
              status: "InProgress",
              active: false
            },
            {
              transactionId: transaction.id, // 
              status: "Approved",
              active: false
            },
            {
              transactionId: transaction.id, // 
              status: "Cancelled",
              active: false
            },
          ],
          skipDuplicates: true

        })
        req.flash("success", "Code generated")
        res.redirect(302, "/admin/create")
      }
    } catch (error) {
      console.log(error)
      req.flash("error", "Internal Server Error")
      res.redirect(302, "/admin/create")
    }
  })
  .get("/configure", async (req, res) => {
    try {
      res.render("update_status", {
        layout: "layouts/admin",//
        title: "Configure Tracking Status",
        tracking_code: codes
      })
    } catch (error) {
      res.render("update_status", {
        layout: "layouts/admin",//
        title: "Configure Tracking Status",
      })
    }
  })
)




const port = process.env.PORT || 8080;

async function main() {
  try {
    app.listen(port, () => {
      console.log(`> Server started on port ${port}`);
    });
    await prisma.$disconnect()
  } catch (e) {
    console.log(e);
    await prisma.$disconnect()
  }
}

main()
  .then()
  .catch()

module.exports = app;
