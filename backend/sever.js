require("dotenv").config();
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const jsonwebtoken = require("jsonwebtoken");
// const jsonMiddleware = express.json();

const app = express();
app.use(cors());
app.use(express.json());
// app.use(jsonMiddleware);

const dbpath = path.join(__dirname, "database.db");
let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbpath, driver: sqlite3.Database });

    app.listen(process.env.PORT, () => {
      console.log(`server running at ${process.env.PORT} port`);
    });
  } catch (e) {
    console.log(`DB Error ${e}`);
  }
};

intializeDbAndServer();

const authentication = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  //   console.log(authHeader);
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(407);
    response.send({ msg: "Inavlid user" });
  } else {
    jsonwebtoken.verify(jwtToken, "my-secret-token", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send({ msg: "invalid jwt token" });
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.get("/api/offers", authentication, async (req, res) => {
  const query = `select * from offers`;
  const dt = await db.all(query);
  res.send(dt);
});

app.get("/api/jahnavi/:id", authentication, async (req, res) => {
  const { id } = req.params;
  //   console.log("jahn ms u");
  const query3 = `select * from rest_details where id= ? `;
  const dt = await db.get(query3, [id]);
  res.send(dt);
});

app.get("/api/restlist", authentication, async (req, res) => {
  const { sort_by_rating, offset, limit } = req.query;
  //   console.log(sort_by_rating);
  const a = sort_by_rating === "Lowest" ? "ASC" : "DESC";
  //   console.log(a);

  const query3 = `select * from rest_list ORDER BY "user_rating.rating" ${a} limit ? offset ? `;
  const dt = await db.all(query3, [limit, offset]);
  res.send(dt);
});

//LOGIN API

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  //   console.log(req);

  const query = `select * from userdetails where email=? and password=?`;

  const user = await db.get(query, [username, password]);
  //   console.log(user);
  if (user === undefined) {
    res.status(400);
    res.send({ msg: "Invalid user" });
  } else {
    const payload = { username: username };
    const token = jsonwebtoken.sign(payload, "my-secret-token");
    // console.log(token);
    res.send({ token });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;

  const user = `select * from userdetails where email=?;`;
  const userdtls = await db.get(user, [email]);

  if (userdtls === undefined) {
    const query = `insert into userdetails(name,email,password)
    values(?,?,?);`;

    const upload = await db.run(query, [username, email, password]);
    res.send({ msg: "successfully created user please login" });
  } else {
    res.send({ msg: "User already exist please login" });
  }
});

app.get("/profile", authentication, async (req, res) => {
  let { username } = req;
  const qry = `select * from userdetails where email=?`;
  const userdtails = await db.get(qry, [username]);
  res.send(userdtails);
});
