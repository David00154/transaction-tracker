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
  try {
    const tracking_code = req.query['tracking_code']
    if (tracking_code == '') {
      res.redirect("/")
    }
    else if (tracking_code == undefined) {
      res.render("track", {
        layout: "layouts/default",//
        tracking_code: tracking_code ?? "",
        data: []
      })
    } else {
      let data = await prisma.transaction.findFirst({
        where: {
          tracking_number: tracking_code
        },
        select: {
          status_point: {
            select: {
              status: true,
              active: true,
              updatedAt: true
            }
          }
        }
      })
      // console.log("> Tracking data: ", data)
      if (data) {
        let status_points = Array.from(data.status_point)
        status_points.sort((a, b) => {
          const order = ["Pending", "InProgress", "Approved"];
          return order.indexOf(a.status) - order.indexOf(b.status)
        })
        res.render("track", {
          layout: "layouts/default",//
          tracking_code: tracking_code ?? "",
          data: status_points
        })
      } else {
        res.redirect("/")
      }
    }
  } catch (error) {
    console.log(error)
    res.render("track", {
      layout: "layouts/default",//
      tracking_code: "",
      data: []
    })
  }
});

app.use("/admin", express
  .Router()
  .get("/", (_, res) => { res.redirect("/admin/create") })
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
            }
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
  .post("/update", async (req, res) => {
    try {
      const { tracking_number, status } = req.body
      if (tracking_number == '') {
        req.flash("error", "The tracking number is required")
        res.redirect("/admin/configure")
      } else if (status == '') {
        req.flash("error", "Please choose a status")
        res.redirect("/admin/configure")
      } else {
        let formerStatusPoint = await prisma.transaction.findUnique({
          where: {
            tracking_number: tracking_number,
          },
          select: {
            tracking_number: true,
            status_point: {
              where: {
                active: true,
              },
              select: {
                status: true,
                id: true
              }
            }
          }
        })
        if (formerStatusPoint.status_point[0].status == status) {
          console.log("same")
          req.flash("success", "Tracking status updated")
          res.redirect("/admin/configure")
        } else {
          // set the current status point to false
          let updatedStatusPoint = await prisma.statusPoint.update({
            where: {
              id: formerStatusPoint.status_point[0].id
            },
            data: {
              active: false
            }
          })
          // get the preferred one
          let $1 = await prisma.transaction.findFirst({
            where: {
              tracking_number: tracking_number
            },
            select: {
              status_point: {
                where: {
                  status: status
                },
                select: {
                  id: true
                }
              }
            }
          })
          // now set the preffered status point
          await prisma.statusPoint.update({
            where: {
              id: $1.status_point[0].id
            },
            data: {
              active: true
            }
          })
          req.flash("success", "Tracking status updated")
          res.redirect("/admin/configure")
        }
      }
    } catch (error) {
      console.log(error)
      req.flash("error", "Internal Server Error")
      res.redirect(302, "/admin/configure")
    }
  })
)


app.use("/api", express
  .Router()
  .get("/get-tracking-numbers", async (req, res) => {
    try {
      let tx = await prisma.transaction.findMany({
        select: {
          name: true,
          tracking_number: true
        }
      })
      res.json(tx)
    } catch (error) {
      res.json(null)
      console.log(error)
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
