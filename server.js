import express from "express";
import cors from "cors";
import supabase from "./supabase.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = process.env.PORT || 7005;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucket = process.env.SUPABASE_STORAGE

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

 

  //reqImageURL
  app.post("/api/getimageurl", async(req, res) => {
    const userId = req.body.id
    const path = `${userId}/avatar`
    const authHeader = req.headers.authorization;
    

    if (!authHeader?.startsWith("Bearer ")) {
      res.send({success: fail})
      return
    }
    
    //unique client has to be used to authenticate user, front end didn't require this
    const supabaseAuth = createClient(
    supabaseUrl, supabaseKey, 
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );

  const {data: user, error: userError} = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    console.log("server userError", userError)
    console.log("server no user")
    res.send({success: false, data: userError})
    return
  }

  const { data, error } = await supabaseAuth.storage.from(bucket)
    .createSignedUrl(path, 60 * 60); 

    if (error) {
      console.log("server error in requesting url", error)
    res.send({success: false});
    return
  }

  res.send({success: true, data: data})
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
