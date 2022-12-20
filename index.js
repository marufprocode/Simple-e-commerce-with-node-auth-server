const express = require('express');
const cors = require ('cors');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const verifyJwt = require('./middleware/verifyJwt');
const { MongoClient, ServerApiVersion } = require('mongodb');

// middleware 
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v8einb9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run () {
    try{
        await client.connect();
        console.log("Database connected");
    }catch(error){
        console.log(error.name, error.message);
    }
}

const usersCollection = client.db(`${process.env.DB_USER}`).collection('users');
const productsCollection = client.db(`${process.env.DB_USER}`).collection('products');

app.post("/jwt", async (req, res) => {
    try {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ token });
    } catch (error) {
      console.log(error.message);
      res.send({
        success: false,
        error: error.message,
      });
    }
  });

app.post ('/create-user', async (req, res) => {
    try{
        const isExist = await usersCollection.findOne({email:req.body.email});
        if (isExist){
            res.send({
                success:false,
                message: "User Already Exists, Please Try another email"
            })
            return;
        }
        const result = await usersCollection.insertOne(req.body);
        if(result.insertedId){
            res.send({
                success: true,
                message: "User Created Successfully"
            })
        }
    } catch(error){
        console.log(error.name, error.message);
        res.send({
            success:false,
            error: error.message
        })
    }
})

app.post('/login', async (req, res) => {
    try{
        const user = req.body;
        const userData = await usersCollection.findOne({email:user.email, password:user.password}, {projection:{password:0}});
        if(!userData){
            res.send({
                success:false,
                message:"User credential doesn't match, try again"
            })
        }
        if(userData){
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: "24h"
              });
            res.send({
                success: true,
                message:'User Found',
                userData,
                token,
            })
        }
    } catch(error){
        console.log(error.name, error.message);
        res.send({
            success:false,
            error: error.message
        })
    }
})

app.get('/getauth', verifyJwt, async (req, res)=> {
    try{
        const payload = req.decoded;
        const userData = await usersCollection.findOne({email:payload.email, password:payload.password}, {projection:{password:0}});
        res.send({
            success:true,
            message:'User Authentication Done',
            userData
        })
    } catch(error){
        console.log(error.name, error.message);
        res.send({
            success:false,
            error: error.message
        })
    }
})

app.get('/products', async (req, res) => {
    try{
        const result = await productsCollection.find({}).toArray();
        res.send({
            success:true,
            products: result
        })
    }catch(error){
        console.log(error.name, error.message);
        res.send({
            success:false,
            error: error.message
        })
    }
})


app.get('/', (req, res) => {
    res.send('Server is Running on port 5000');
})


app.listen(port, (req, res) => console.log(`Listening to port ${port}`));