const express = require('express');
const cors = require ('cors');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const verifyJwt = require('./middleware/verifyJwt');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
const cartCollection = client.db(`${process.env.DB_USER}`).collection('cart');

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

app.put('/addto-cart', verifyJwt, async (req, res) => {
    try{
        if(req.query.email !== req.decoded.email){
            res.status(401).send({
                success:false,
                message:"Unauthorized Access"
            }) 
            return;
        }
        const product = req.body;
        const isExits = await cartCollection.findOne({buyerEmail:product.buyerEmail, name:product.name});
        if(isExits){
            const updateOne = await cartCollection.updateOne({buyerEmail:product.buyerEmail, name:product.name}, {$set:{quantity:isExits.quantity+1}}, {upsert:true})
            if(updateOne.modifiedCount){
                res.send({
                    success:true,
                    message:"Successfully Added to The Cart"
                })
            }
            
        }else{
            const result = await cartCollection.insertOne(product)
            if(result.insertedId){
                res.send({
                    success:true,
                    message:"Successfully Added to The Cart"
                })
            }
        }
    }catch(error){
        console.log(error.name, error.message);
        res.send({
            success:false,
            error: error.message
        })
    }
})

app.delete('/delete-cart', verifyJwt, async (req, res) => {
    try{
        if(req.query.email !== req.decoded.email){
            res.status(401).send({
                success:false,
                message:"Unauthorized Access"
            }) 
            return;
        }
        const result = await cartCollection.deleteMany({buyerEmail:req.query.email})
        if(result.deletedCount){
            res.send({
                success:true,
                message:"Successfully Deleted All Cart Items",
            })
        }
    }catch(error){
        console.log(error.name, error.message);
        res.send({
            success:false,
            error: error.message
        })
    }
})
app.delete('/delete-cart-item', verifyJwt, async (req, res) => {
    try{
        if(req.query.email !== req.decoded.email){
            res.status(401).send({
                success:false,
                message:"Unauthorized Access"
            }) 
            return;
        }
        const result = await cartCollection.deleteOne({_id:ObjectId(req.query.id)})
        if(result.deletedCount){
            res.send({
                success:true,
                message:"Successfully Deleted the Item"
            })
        }
    }catch(error){
        console.log(error.name, error.message);
        res.send({
            success:false,
            error: error.message
        })
    }
})

app.get('/cart-items', verifyJwt, async (req, res) => {
    try{
        if(req.query.email !== req.decoded.email){
            res.status(401).send({
                success:false,
                message:"Unauthorized Access"
            }) 
            return;
        }
        const result = await cartCollection.find({buyerEmail:req.query.email}).toArray();
        if(result.length){
            res.send({
                success:true,
                cartItems:result
            })
        } else{
            res.send({
                success:false,
                message:"No Cart Items Found with this user",
                cartItems:[]
            })
        }

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