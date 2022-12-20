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

app.post ('/create-user', async (req, res) => {
    try{
        const isExist = usersCollection.findOne({email:req.body.email});
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


app.get('/', (req, res) => {
    res.send('Server is Running on port 5000');
})


app.listen(port, (req, res) => console.log(`Listening to port ${port}`));