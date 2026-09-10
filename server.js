import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import express from "express";
import cors from "cors";
import supabase from "./supabase.js";

const app = express();
const PORT = process.env.PORT || 7005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  console.log("GET / was received");
  res.send("Hello from LV426");
});

//API Auth Requests
  //getUserData
  app.get("/getuserdata", (req, res) => {

  })

  //addUserName
  app.get("/addusername", (req, res) => {

  })

  //signInUser
  app.get("/signin", (req, res) => {

  })

  //signUpUser
  app.get("/signup", (req, res) => {

  })

  //signOut
  app.get("/signout", (req, res) => {

  })

  //reqImageURL
  app.get("/getimageurl", (req, res) => {

  })

  //uploadImage
  app.get("/uploadimage", (req, res) => {

  })

  //resetPassword
  app.get("/resetpassord", (req, res) => {

  })

  //validate? might be a front end
  app.get("/validate", (req, res) => {

  })

  //deleteAccount
  app.get("/deleteuser", (req, res) => {

  })


//API Modal/Vote Requsts
  //updateVote
  app.get("/updateVote", (req, res) => {

  })



app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
