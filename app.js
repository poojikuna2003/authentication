const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log(`Server is running`);
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API-1 REGISTER

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser != undefined) {
    response.send("User already exists");
    response.status(400);
  } else {
    const postUserDetails = `INSERT INTO user (username,name,password,gender,location)
    VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    const dbResponse = await db.run(postUserDetails);

    if (password.length < 5) {
      response.send("Password is too short");
      response.status(400);
    } else {
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API-2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  //console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (comparePassword) {
      response.send("Login success!");
      response.status(200);
    } else {
      response.status(400);
      response.send("Invalid password");
      //response.status(400);
    }
  }
});

//API-3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Not Registered");
  } else {
    if (comparePassword === true) {
      if (newPassword.length < 5) { 
        response.status(400);
        response.send("Password is too short");
        //response.status(400);
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `UPDATE 
            user 
            SET password = '${hashedPassword}'
            WHERE username = '${username}';`;
        const dbResponse = await db.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
