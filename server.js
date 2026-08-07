const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello")
});

//endpoints
//signup
app.get("/signup", (req, res) => {

})
//signin
app.get("/signup", (req, res) => {
  
})
//if I can't do it in signUp, update metadata
app.get("/signup", (req, res) => {
  
})
//delete account
app.get("/signup", (req, res) => {
  
})
//vote for a park
app.get("/signup", (req, res) => {
  
})
//vote for a store
app.get("/signup", (req, res) => {
  
})


const PORT = process.env.port || 3000;
app.listen(PORT, () => {
  console.log(`Sever running on ${PORT}`)
})