//Create express app
const express = require("express");
let app = express();
const session = require("express-session");

//Variables
const { render } = require("pug");
let mongo = require("mongodb");
let MongoClient = mongo.MongoClient;
let db;

//Storing sessions in MongoDB
const MongoDBStore = require("connect-mongodb-session")(session);

let userSessions = new MongoDBStore({
  uri: "mongodb://localhost:27017/a4",
  collection: "mySessions",
});

app.use(
  session({
    secret: "some secret here",
    store: userSessions,
    resave: true,
    saveUninitialized: false,
  })
);

//Middleware
app.use(exposeSession);

app.use(express.static("public"));

app.use(express.json());

//View engine
app.set("view engine", "pug");

//Routers
app.get("/register", sendRegisterForm);

app.get(["/home", "/"], sendHome);

app.get("/users", sendUsers);
app.get("/users/:userID", sendSingleUser);

app.get("/loginConfirm", sendLogin);
app.get("/login", (req, res) => {
  res.render("login", {});
});

app.get("/logout", sendLogout);

app.get("/registerConfirm", sendRegisterConfirm);

app.get("/order", auth, (req, res) => {
  res.render("order", {});
});

app.get("/privacyToggle", auth, updatePrivacy);

app.post("/orders", sendSubmitOrder);

app.get("/orders/:orderID", sendUserOrder);

//Allows sessions to be used in all PUG files etc
function exposeSession(req, res, next) {
  if (req.session) res.locals.session = req.session;
  next();
}

//Logs in the user if the username & password are valid. Username is case-insensitive and exact.
function sendLogin(req, res, next) {
  console.log("Login Function");
  if (req.session.loggedin) {
    res.status(403).send("Already logged in.");
    return;
  }
  let userName = req.query.username;
  let password = req.query.password;
  let regexUserName = "^" + userName + "$";
  db.collection("users").findOne(
    { username: { $regex: regexUserName, $options: "i" }, password: password },
    function (err, result) {
      if (err) {
        res.status(500).send("Error reading database");
        return;
      }

      if (!result) {
        res.status(401).send("Invalid login information");
        return;
      }
      req.session.loggedin = true;
      req.session.userName = result.username;
      req.session.userID = result._id;
      res.locals.session = req.session;
      res.status(200).redirect("/");
      return;
    }
  );
}

//Logs out a user
function sendLogout(req, res, next) {
  req.session.destroy();
  delete res.locals.session;
  res.status(200).redirect("/");
  return;
}

//Helper function to authenticate
function auth(req, res, next) {
  console.log("Handling request from: " + req.session.userName);
  if (req.session.loggedin) {
    next();
  } else {
    res.status(401).send("Unauthorized");
    return;
  }
}

//Function to handle request for home
function sendHome(req, res, next) {
  res.render("home", {});
}
//Function to handle request for register
function sendRegisterForm(req, res, next) {
  res.render("register", {});
}
//Function to handle request for list of users
function sendUsers(req, res, next) {
  let userName = req.query.name;
  //Only retrives users with prvacy set to false with userName beign case insensitive
  db.collection("users")
    .find({ privacy: false, username: new RegExp(userName, "i") })
    .toArray((err, result) => {
      if (err) {
        res.status(500).send("Error reading database");
        return;
      }
      res.render("users", { users: result });
    });
}

//Function to handle request for a single user
function sendSingleUser(req, res, next) {
  let oid;
  try {
    oid = new mongo.ObjectID(req.params.userID); //makes a mongo id object
  } catch {
    res.status(404).send("Unknown ID");
    return;
  }

  //Checks if user can be found,
  db.collection("users").findOne({ _id: oid }, function (err, result) {
    if (err) {
      res.status(500).send("Error reading database.");
      return;
    }
    if (!result) {
      res.status(404).send("Unknown ID. User ID cant be found!");
      return;
    }
    //Checks if the user is private && if the user is currently logged in
    if (result.privacy && !result._id.equals(req.session.userID)) {
      res.status(403).send("Cant view User! User has privacy enabled.");
      return;
    }

    //Gets all the orders ordered by the user
    db.collection("orders")
      .find({ userID: result._id })
      .toArray((err2, orders) => {
        if (err2) {
          res.status(500).send("Error reading database.");
        }
        res.render("user", { user: result, userOrders: orders });
      });
  });
}

function sendUserOrder(req, res, next) {
  console.log("Sending ORDER");
  let oid;
  try {
    oid = new mongo.ObjectID(req.params.orderID); //Mongo ID object
  } catch {
    res.status(404).send("Unknown ID");
    return;
  }

  //Checks if order ID is valid
  db.collection("orders").findOne({ _id: oid }, function (err, result) {
    if (err) {
      res.status(500).send("Error reading database");
      return;
    }
    //If order cant be fond, send error 404
    if (!result) {
      res.status(404).send("Unknown ID. Order ID cant be found!");
      return;
    }
    //Finds the user who made those orders
    db.collection("users").findOne({ _id: result.userID }, (err2, user) => {
      if (err2) {
        res.status(500).send("Error reading database");
        return;
      }
      //Checks if the user has private mode on & if the user is currently logged in
      if (user.privacy && !user._id.equals(req.session.userID)) {
        res
          .status(403)
          .send("Cant view Order! User who placed has enabled privacy.");
        return;
      }
      //JSON object to hold the ordered item to make it easier in PUG file
      let soldItems = result.order.order;

      res.render("userOrder", { order: result, soldItems: soldItems });
    });
  });
}

function sendRegisterConfirm(req, res, next) {
  //Checks if user is logged in
  if (req.session.loggedin) {
    res.status(403).send("Already logged in.");
    return;
  }

  //gets the data from query
  let userName = req.query.username;
  let password = req.query.password;
  //incase data is mising
  if (userName === "" || password === "") {
    res.status(401).send("Missing username or password!");
    console.log("Missing username or password!");
    return;
  }

  let regexUserName = "^" + userName + "$"; //Regex statement for a matching username that is case insensitive

  //Default user Object
  let newUser = {
    username: userName,
    password: password,
    privacy: false,
  };

  //Checks if any matching user can be found
  db.collection("users").findOne(
    { username: { $regex: regexUserName, $options: "i" } },
    (err, result) => {
      if (err) {
        res.status(500).send("Error reading database.");
        return;
      }
      console.log(result);

      //If the username cant b found, insert one into the database
      if (!result) {
        db.collection("users").insertOne(newUser, (err2, data2) => {
          if (err2) {
            res.status(500).send("Error writing to database!");
            return;
          }
          console.log("Added a new user");
          req.session.loggedin = true;
          req.session.userName = userName;
          req.session.userID = data2.insertedId;
          res.locals.session = req.session;
          res.send("http://127.0.0.1:3000/users/" + data2.insertedId);
        });
      } else {
        res.status(401).send("Username already exists!");
      }
    }
  );
}

function sendSubmitOrder(req, res, next) {
  //Most data is sent from client
  //Adds 2 new property, username & userID
  let data = {};
  data.userID = req.session.userID;
  data.user = req.session.userName;
  data.order = req.body;

  //inserts one into a orders collection
  db.collection("orders").insertOne(data, (err, result) => {
    if (err) {
      res.status(500).send("Error writing to database!");
      return;
    }
    res.status(200).send("Success");
  });
}

//Function to change the privacy status of each user.
function updatePrivacy(req, res, next) {
  let data = req.query.privacy;
  //Incase the query is empty
  if (data === "") {
    res.status(401).send("Missing privacy value!");
    return;
  }
  let newPrivacy = false;
  if (data.toLowerCase() === "true") newPrivacy = true; //Change the privacy to a boolean value from a string

  //Updates the privacy of the current activate session's
  db.collection("users").updateOne(
    { _id: req.session.userID },
    { $set: { privacy: newPrivacy } }
  );

  //Send a successfull msh
  res.send("Success!");
}

//Function to change the password of the current user
function changePassword(req, res, next) {
  let data = req.query.password;
  //Incase the query is empty
  if (data === "") {
    res.status(401).send("Missing password!");
    return;
  }
  else{
    //Updates the password of the current activate session's
    db.collection("users").updateOne(
      { _id: req.session.userID },
      { $set: { password: data } }
    );
    res.send("Success!");
  }

}

// Initialize database connection
MongoClient.connect("mongodb://localhost:27017/", function (err, client) {
  if (err) throw err;

  //Get the t8 database
  db = client.db("rms");

  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Listening on http://127.0.0.1:3000");
});
