import express from "express";
import cors from "cors";
import supabase from "./supabase.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

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
    const {email, password, token, hp} = req.body
    const SECRET_KEY = process.env.CLOUDFLARE_SECRET;

    //if the honeypot in the form was filled out it ends the request
    if(hp !== ""){
      return res.send({
        success: false,
        data: "Bot triggered Honeypot",
        turnstile: {
          success: false,
          data: "Turnstile was not checked due to honeypot being triggered"
        }
      })
    }

    if (!email || !password) {
    return res.send({
      success: false,
      data: "Missing email or password",
      turnstile: {
        success: false,
        data: "Turnstile was not checked",
      },
    });
    }

    
    

    try {
      const { data, error } = await supabase.auth.signInWithPassword({email, password, options: {captchaToken: token}})
      if(error){
        console.log("server error ", error)
        res.send({success: false, data: error})
      }
      console.log("signin worked")
      res.send({success: true, data})
    }catch(err){
      console.log("server error err : ", err)
      res.send({success: false, data: err})
    }
  })

  //signUpUser
  app.post("/api/signup", async (req, res) => {
    console.log("signup user called")
  const { email, password, username, token, hp } = req.body;
  const SECRET_KEY = process.env.CLOUDFLARE_SECRET;

  //check for honeypot trigger
  if(hp !== "") {
    return res.send({
      success: false,
      data: "Bot triggered honeypot"
    })
  }

  //Do I need to add !token
  if (!email || !password || !username) {
    return res.send({
      success: false,
      data: "Missing email, password, or username",
    });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: token,
        data: {
          username,
        },
      },
    });

    if (error) {
      console.log("supabase error sign up user : ", error)
      return res.send({
        success: false,
        data: error,
      });
    }
    
    return res.send({success: true, data,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.send({success: false, data: error
    });
  }
});


  

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

  //request image url
  app.post("/api/reqimageurl", async (req, res) => {
    const path = req.body.path

    const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
      auth: {
         autoRefreshToken: false,
          persistSession: false,
      }
    })

    try{
      const {data, error} = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60)
      
      if(error || !data?.signedUrl){
        return res.send({success: false, data: error})
      }
      
      return res.send({success: true, data: data})
    } catch(err){
      
      return res.send({success: false, data: err})
    }

  })

  //upload image
  app.post("/api/uploadimg", upload.single("file"),  async (req, res) => {
    const {bucket, path, userId} = req.body;
    const file = req.file;

    console.log({ bucket, path, userId });
    console.log(file?.originalname, file?.mimetype, file?.size);
   
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
      auth: {
         autoRefreshToken: false,
          persistSession: false,
      }
    })

    if(!file || !bucket || !path || !userId){
      return res.send({success: false, data: "missing file, bucket, userId or path"})
    }

    try{
      const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file.buffer, {
      upsert: true,
      contentType: file.mimetype,
    });

    if(uploadError){
      console.log("uploadError : ", uploadError)
      return res.send({success: false, data: "There was an upload error, try again."})
    }

    const {data, reqError} = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60)

    if(reqError){
      console.log("reqError : ", reqError)
      return res.send({success: false, data: "There was an error requesting your profile iimage"})
    }

    return res.send({success: true, data: data})

    }catch(err){
      console.log("catch err : ", err)
      return res.send({success: false, data: err})
    }
  })

  //reset pass
  app.post("/api/resetpass", async (req, res) => {
    const {email, token} = req.body

    try{
      const { data, error } = await supabase.auth.resetPasswordForEmail(email,{ redirectTo: "http://localhost:5173/validate", captchaToken: token})
      if(error){
        console.log("error reset password : ", error)
        return res.send({success: false, data: error})
      }
      return res.send({success: true, data: data})
    }catch(err){
      console.log("err in catch : ", err)
      return res.send({success: false, data: err})
    }
  })

  //change password
  app.post("/api/changepass", async (req, res) => {
    const {pass, oldpass, token, session} = req.body

    //access token needs to be sent

    //console.log("in change pass : ", pass, userId, token, accessToken)
    //Do I need the auth version of supabase?

      const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

    if(!pass || !oldpass || !token){
      return res.send({success: false, data: "missing user id or password"});
    }

    
    try{
      const {data: {user}, error: userError} = await supabase.auth.getUser(session);

      if(!user || userError){
        return res.send({success: false, data: "Missing user or unable to find user"});
      }


      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {password: pass, current_password: oldpass})

      if(error){
        console.log("error c pass : ", error)
        return res.send({success: false, data: error.message})
      }
      console.log("it changed")
      return res.send({success: true, data: "none"})
    }catch(err){
      console.log("error catch : ", err)
      return res.send({success: false, data: err.message})
    }
     
  })


//API Modal/Vote Requsts
  //updateVote
  app.post("/api/updatevote", async (req, res) => {
    const {id, locationVotes, storeuuid, type, userVotesArr, choice} = req.body
    //console.log("all variables server ", id, locationVotes, storeuuid, type, userVotesArr, choice)
  
    const supabaseAd = createClient(
      supabaseUrl,
      supabaseService,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    //The locations current up and down votes total
    let currLocVotes = {up: Number(locationVotes.up || 0), down: Number(locationVotes.down || 0)}
    //users vote history for location or bland entry
    let currUserVote = userVotesArr.find((vote) => vote.id === storeuuid) || {id: storeuuid, up: false, down: false}
    //users vote history array
    let currUserVotesArr = [...userVotesArr]

    let updatedVote = {...currUserVote}

    //check the users vote 
    if (choice === "up") {
    if (currUserVote.up) {
      // Second upvote click: remove the upvote
      updatedVote.up = false;
      currLocVotes.up -= 1;
    } else {
      // Add an upvote
      updatedVote.up = true;
      currLocVotes.up += 1;

      // Remove an existing downvote when switching
      if (currUserVote.down) {
        updatedVote.down = false;
        currLocVotes.down -= 1;
      }
    }
  } else if (choice === "down") {
    if (currUserVote.down) {
      // Second downvote click: remove the downvote
      updatedVote.down = false;
      currLocVotes.down -= 1;
    } else {
      // Add a downvote
      updatedVote.down = true;
      currLocVotes.down += 1;

      // Remove an existing upvote when switching
      if (currUserVote.up) {
        updatedVote.up = false;
        currLocVotes.up -= 1;
      }
    }
  }

    //add updated vote to users vote arr
    let updatedVotesArr = [...currUserVotesArr]
    const index = updatedVotesArr.findIndex(vote => vote.id === storeuuid)

    //if it doesn't exist add new vote obj
    if(index === -1){
      updatedVotesArr.push(updatedVote)
    } else {
      updatedVotesArr[index] = updatedVote
    }

    let errorTracker = []

    //add the updated votes array to profile
    const {error: profileError} = await supabaseAd.from("profiles").update({[type]: updatedVotesArr}).eq("id", id)
    
    if(profileError){
      errorTracker.push({error: "There was an error updating the user profile voting information. Please refresh and try again"})
      res.send({success: false, data: errorTracker})
      return
    }

    const {error: locationError} = await supabaseAd.from(type).update({votes: currLocVotes}).eq("uuid", storeuuid)
    
    if(locationError){
      console.log("Location Error ", locationError)
      errorTracker.push({error: "There was an error updating the location's voting data. Please refresh and try again"})
    }
    if(errorTracker.length){
      console.log("in voting func ", errorTracker)
      res.send({success: false, data: errorTracker})
      return
    }else {
      res.send({success: true})
      return
    }
  })



app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});



/* 10/17
//signInUser
  app.post("/api/signin", async (req, res) => {
    const {email, password, token, hp} = req.body
    const SECRET_KEY = process.env.CLOUDFLARE_SECRET;

    if(hp !== ""){
      return res.send({
        success: false,
        data: "Bot triggered Honeypot",
        turnstile: {
          success: false,
          data: "Turnstile was not checked due to honeypot being triggered"
        }
      })
    }

    if (!email || !password) {
    return res.send({
      success: false,
      data: "Missing email or password",
      turnstile: {
        success: false,
        data: "Turnstile was not checked",
      },
    });
    }

    async function validateTurnstile(token, remoteip) {
    try {
      if (!token) {
        return {
          success: false,
          data: "no token",
        };
      }

      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret: SECRET_KEY,
            response: token,
            ...(remoteip && { remoteip }),
          }),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Turnstile validation error:", error);

      return {
        success: false,
        data: error,
        data: "Turnstile validation failed internally",
      };
    }
  }
    
  const turnstileInfo = await validateTurnstile(token, req.ip);

  if (!turnstileInfo.success) {
    return res.send({
      success: false,
      data: "Turnstile verification failed",
      turnstile: turnstileInfo,
    });
  }
    

    try {
      const { data, error } = await supabase.auth.signInWithPassword({email, password})
      if(error){
        //console.log("server error ", error)
        res.send({success: false, data: error})
      }
      res.send({success: true, data, turnstile: turnstileInfo})
    }catch(err){
      //console.log("server error err : ", err)
      res.send({success: false, data: err, turnstile: turnstileInfo})
    }
  })

*/

/* 10/17
 //signUpUser
  app.post("/api/signup", async (req, res) => {
  const { email, password, username, token } = req.body;
  const SECRET_KEY = process.env.CLOUDFLARE_SECRET;

  if (!email || !password || !username) {
    return res.send({
      success: false,
      data: "Missing email, password, or username",
      turnstile: {
        success: false,
        data: "Turnstile was not checked",
      },
    });
  }

  async function validateTurnstile(token, remoteip) {
    try {
      if (!token) {
        return {
          success: false,
          data: "no token",
        };
      }

      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret: SECRET_KEY,
            response: token,
            ...(remoteip && { remoteip }),
          }),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Turnstile validation error:", error);

      return {
        success: false,
        data: error,
        data: "Turnstile validation failed internally",
      };
    }
  }

  const turnstileInfo = await validateTurnstile(token, req.ip);

  if (!turnstileInfo.success) {
    return res.send({
      success: false,
      data: "Turnstile verification failed",
      turnstile: turnstileInfo,
    });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      return res.send({
        success: false,
        data: error,
        turnstile: turnstileInfo,
      });
    }

    return res.send({success: true, data, turnstile: turnstileInfo,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.send({success: false, data: error, turnstile: turnstileInfo,
    });
  }
});
 */