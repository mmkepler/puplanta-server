import express from "express";
import cors from "cors";
import supabase from "./supabase.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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
  app.post("/api/getuserdata", async (req, res) => {
    //console.log("in server req ", req.body)
    const id = req.body.id
   
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
      if(error){
        console.log("getUserData error ", error)
        res.send({success: false, data: error})
      }
      res.send({success: true, data: data})
    } catch(err){
      console.log("caught error in getuserdata")
      res.send({success: false, data: err})
    }

  })

  //signInUser
  app.post("/api/signin", async (req, res) => {
    //console.log("server in signin : ", req.body)
    const email = req.body.email
    const pw = req.body.password

    try {
      const { data, error } = await supabase.auth.signInWithPassword({email: email, password: pw})
      if(error){
        //console.log("server error ", error)
        res.send({success: false, data: error})
      }
      res.send({success: true, data})
    }catch(err){
      //console.log("server error err : ", err)
      res.send({success: false, data: err})
    }
  })

  //signUpUser
  app.post("/api/signup", async(req, res) => {
    const [email, password, username] = req.body
    try{
      const {data, error} = await supabase.auth.signUp({email, password, options: {
      data: {username}
    }})
    if(error){
      //console.log("sign up error ", error);
      res.send({success: false, error})
    }
    
      res.send({success: true, data})
    }catch(err){
      res.send({success: false, err})
    }
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
