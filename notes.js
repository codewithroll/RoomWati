//-------------------------------------------------- This file is exlusively for mischellenous notes of this project -------------------------------------------------

// Form validations:
// when we enter the data in the form, the browser and/or the web server will check to see the that the data is in the correct format and within the constraints set by the applications

// Now they are of two types:
// -> client side : Jb user incomplete ya incorrect data enter krde
// -> server side : Jb data in the database is not according to the schema set by the DB or when there occurs an error while editing or updating the data in the DB

// Ab hum yeh incomplete data by the user/client wali cheez apne input field mein "required" keyword add krke bhi bhi kr skte h but wo firr browser to browser alg way mein message show krega and we want to make our project standardised toh isiliye hum bootstrap styling apply krenge

// Now to handle schema validation like agr user jo data enter kr rha h wo sahi bhi h ya NavigationHistoryEntry,
// the first method is to do this,
// f(!newListing.title){
//         throw new ExpressError(400,"Title is missing!");
//     }
//     yeh line hume hrr input field k likhna padega like title,description,etc so ofc it will be a tedious job when dealing with multiple models, isiliye we will use the second method i.e., "JOI" iska kaam hota h schema ko validate krna

//     isko use krne k liye pehle isse require krna h then require(go tot he official website if you forget how to use this)

// client side validation -> form mein kiya
// server side validation -> using JOI (schema.js)

// Cookies:
// for personalisation:

// how to send cookies thorugh express?

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const { Database } = require("lucide-react");

// app.use(cookieParser());

// Signed cookies: Basically cookies mein changes ya unhe tempering se bachane k liye hum cookies ko sign krte h aur fir kisi page p receive hone k baad hum inhe recheck krte h ki kya yeh signed h ya nhi isse before after wala data check ho jaata h kind off

app.use(cookieParser("secretcode")); //secret code attach krke bhejte h isme isse cookie ki values encode krke jaati h instead of raw data form

app.get("/getsignedcookie",(req,res)=>{
    res.cookie("made-in","India", {signed:true});
    res.send("signed cookie sent");
})

// ab signed cookie verify krne k liye:
app.get("/verify",(req,res)=>{
    console.log(req.signedCookies); //express cookies ko signed aur unsigned cookies mein didvde krta h, jb hum cookies ko parse krte h tb hume unsigned cookies milti h by default isiliye we use "signedCookies" to parse signed cookies, ab agr koi iss cookie mein changes krta h toh hume output mein iske data ki jgh {} milega jisse we can know if the cookie was tempered or not
    res.send("verfied!");
})

app.get("/getcookies",(req,res)=>{
    res.cookie("greet","namaste");
    res.cookie("madeIn","India");
    res.send("sent you some cookies!");
});

app.get("/",(req,res)=>{
    console.dir(req.cookies);
    res.send("Hi, I'm root");
})

app.get("/greet",(req,res)=>{ //cookies mein se name walal parameter lekr usko message mein add krke page p display krega (personalisation)
    let {name = "anonymous"} = req.cookies;
    res.send(`Hi ${name}`);
})


// name value pair send kr skte h cookies k through

// Ab cookies ko parse ya access krne k liye hum ek middleware use krte h "Cookie-parser" isko pehle install krke firr require krne k n=baad use krna hota h uske baad jo bhi request aaegi wo pehle isse pass hogi firr aage routes p jaegi



app.listen(3000,()=>{
    console.log("Server is live!");
})


// What is state:
// Stateful protocol: Requires server to save the status and session information, ex- ftp
// Stateless protocol: Does not require the server to retain the server information or status, ex- http

// Express session: An attempt to make our session stateful, basically yeh kuch data kisi temporary storage mein store krta h for a particular data aur uss storage k according ek id provide krta firr hum uss id ko as a cookie store krwa skte h so that agr user ek page se dusre page p bhi jae tb bhi server ko pta rhe, iska implementation is in classroom wala folder

// ---------------------------------------------------------------------------------------

// Authentication: Is the process of verifying who someone is.
// Authorization: Is the process of verifying what specific applications, files, and data a user has access to.

// Storing Passwords:
// We never store the passwords as it isFinite. We store their hashed form.

//During Sign-up:
// Password -> Hashing function -> Hashed form -> stored in the database.

// During login (verification k time p):
// Database -> Hashed form -> Hashing function -> Password -> verification

// Characterisitcs of Hashingfunction:

// For every InputDeviceInfo, there is a fixed output
// They are one-way functions, we can't get input from output
// For a different input, there is a different output but of same length
// Small changes in input should bring large changes in output

// example - SHA256, MD5, CRC, BCRYPT, etc.


// Salting:
// Password salting is a technique to protect passwords stored in databases by adding a string of 32 or more characters and then hashing them.

// To Authenticate in most industries and in our project as well, we'll use a library named "PassPort" - passportjs.org : Express compatible authentication middleware for Nodejs

// To get started:
// npm i passport
// npm i passport-local
// npm i passport-local-mongoose 

//yeh s hum users wale model mein implemenet krenge

// How to check if User is logged in before allowing him to add a listing?
// req.isAuthenticated() - with passport (added this in the listing.js of routes)

// MVC: Model, View, Controller : Way to implement design pattern for listings.

// Model: Stores fucntionalities of the Database.
// View: Stores fucntionalities of the Frontend.
// Controller: Stores fucntionalities of the Backend. (saare callbacks ko ek separate file ya files mein shift krenge jisse humari main file aur compact bne aur humare allover code aur readable bne, see controller folder for these files)

//Rating with stars: iske liye we will use a library named "starability", starabiltiy k github page p jaake css mein se koi bhi choose kr skte h but hum kr rhe h starability slot effect

//To add the functionality to upload an image directly we have to make some changes cause abhi humara form is not capable:

// 1- form is not capabale of sending files to backend, wo abhi sirf raw data hi send kr rha h

// 2- Agr form kaise bhi krke hum capable bna bhi le tbh bhi monggoDB mein limit hoti h file size ki wo alag issue hoga

// Ab iske liye hum kisi third party service (cloudinary use kr rhe h hum) ka use kr skte to store our files like aws, etc pr project k liye abhi free website use krenge

// yeh website humari files save krke uska link generate krdegi aur firr hum uss link ko moongoDB mein save krwaenge

// Abhi form utlencoded data send kr paa rha h but jb bhi hume file bhi send krwani hoti h tb hum ek enctype yani encoding type change krte h to "multipart/form-data"

// AB inn files ko parse krne k liye in app.js we will use another middleware known as "multer", isko i install krke routes wale listing.js mein require krenge

// Ab cloudinary k credentials jo ki code k through usko access krne k liye required hote h unko hum .env file mein save krwange aur uss .env file ko all over the code kahi bhi access krne k liye hum ek aur library ka use krenge jiska name h "dotenv" - yeh hume .env files ka data use krne mein help krti h

// hum multer aur cloudinary ko saath mein use krne k liye ek aur library ko use kreng named "multer-storage-cloudinary"

//Ab image edit krne k liye hum current image ka preview bhi denge jisse user dekh ske ki abhi konsi pic lgi h but usko hum original image ki trh nhi blki uske kuch parameter change krke dikhaenge like thodi blur krke, yeh hum krenge cloudinary k kuch keywords use krke jo ki image link mein likhe jaate h toh apply


//Next hum map location wala feature add krenge toh humko usko lagegi map API uske liye hum google ki bhi use kr skte h but wo credit card info mangta h isiliye hum uska ek alternative use krenge jiska name h "Mapbox" yeh bhi kaafi well known aur professionally used API h

//Mapbox mein hum pehle longitude ki value dete firr latitude which is the opposite of the traditional practice toh yeh dhyaan rakhiyo




AIzaSyBKrUQ4090Fnu7ktKIC9x1VuvxAJA13SVM