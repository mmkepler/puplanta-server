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
const supabaseService = process.env.SUPABASE_SERVICE
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
    const {email, password, username} = req.body

    if(!email || !password || !username){
      return {success: false, data: "missing email, password or username"}
    }

    try{
      const {data, error} = await supabase.auth.signUp({email, password, options: {
      data: {username}
    }})
    if(error){
      //console.log("sign up error ", error);
      res.send({success: false, data: error})
      return
    }
    
      res.send({success: true, data})
    }catch(err){
      res.send({success: false, data: err})
    }
  })

  

  //deleteAccount
  app.post("/api/deleteuser", async (req, res) => {
    let userId = req.body.id
    let path = `${userId}/avatar`
    const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
      auth: {
         autoRefreshToken: false,
          persistSession: false,
      }
    })
    try{
      const {error: deleteError} = await supabase.storage.from(bucket).remove([path])

      if(deleteError){
        return {success: false, data: deleteError}
      }

      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if(error){
        console.log("server delete user error :", error)
        return {success: false, data: error}
      }
      return {success: true, data}
      
    }catch(err){  
      console.log("server delete user catch error :", err)
      return {success: false, data: err}
    }
  })


//API Modal/Vote Requsts
  //updateVote
  app.get("/updateVote", (req, res) => {

  })



app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
