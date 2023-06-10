const express =require('express')
const cors=require('cors')
const stripe=require('stripe')(process.env.PAYMENT_SECRET_KEY)
const app=express()
require('dotenv').config()
app.use(cors())
app.use(express.json())
const jwt = require('jsonwebtoken');
const port=process.env.PORT || 6500
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgce6rp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// verify jwt 

const verifyJwt=(req,res,next)=>{
    const authorization =req.headers?.authorization
    if(!authorization){
        res.status(401).send({error:true,message:'Unauthorized access!'})
    }
    const token=authorization?.split(' ')[1]
    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded)=> {
        if(err){
           return res.status(401).send({error:true,message:'Unauthorized access!'})
        }
        req.decoded = decoded;
        next();
      });
}








async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const ClassesCollection = client.db("tunes").collection("classes");
    const SelectedCollection = client.db("tunes").collection("selected");
    const usersCollection = client.db("tunes").collection("users");

app.get('/classes',async(req,res)=>{
    const result =await ClassesCollection.find().toArray()
    res.send(result)
})

app.post ('/userClass',async(req,res)=>{
    const selected =req.body
    const result=await SelectedCollection.insertOne(selected)
    res.send(result)
})

app.get('/singleClass/:id',async(req,res)=>{
    const id =req.params.id
    const query ={_id : new ObjectId(id)}
    const result = await SelectedCollection.findOne(query)
    res.send(result)
})


app.put('/update/:id',async(req,res)=>{
    const id = req.params.id
    
    const filter={_id: new ObjectId(id)}
    const options = { upsert: true };
    const updateData=req.body
    console.log(updateData);
    const updatedDoc ={
        $set: {
            availableSeats:updateData.remaining,
         },
      }
      const result = await ClassesCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
})

app.put('/approveClass/:id',async(req,res)=>{
    const id = req.params.id
    
    const filter={_id: new ObjectId(id)}
    const options = { upsert: true };
    const updateData=req.body
    console.log(updateData);
    const updatedDoc ={
        $set: {
            status:updateData.approve
         },
      }
      const result = await ClassesCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
})

app.put('/denyClass/:id',async(req,res)=>{
    const id = req.params.id
    
    const filter={_id: new ObjectId(id)}
    const options = { upsert: true };
    const updateData=req.body
    console.log(updateData);
    const updatedDoc ={
        $set: {
            status:updateData.deny
         },
      }
      const result = await ClassesCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
})

// btn disable 
app.patch('/setDisable/:id',async(req,res)=>{
    const id = req.params.id
    
    const filter={_id: new ObjectId(id)}
    const options = { upsert: true };
    const updateData=req.body
    console.log({updateData});
    const updatedDoc ={
        $set: {
            disable:updateData.btnDisable
         },
      }
      const result = await ClassesCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
})

app.get('/myClass',verifyJwt,async(req,res)=>{
      const email =req.query?.email
     
      if (!email) {
        return res
          .status(403)
          .send({ error: "No classes found" });
      }
      if (req.decoded?.email !== email) {
        return res.status(403).send({ error: "Unauthorized access!" });
      }
      const filter ={email:email}
      const result =await SelectedCollection.find(filter).toArray()
      res.send(result)
})

app.delete('/myClass/:id',async(req,res)=>{
    const id =req.params.id
    const query = { _id: new ObjectId(id) };
        const result=await SelectedCollection.deleteOne(query)
        res.send(result)
})



//users collection
app.post('/users',async(req,res)=>{
    const user=req.body
    const query={email:user.email}
    const existUser=await usersCollection.findOne(query)
    if(existUser){
        return res.send({message:'User already exist'})
    }
    const result=await usersCollection.insertOne(user)
    res.send(result)
})

// verify admin
const verifyAdmin=async(req,res,next)=>{
    const email =req.decoded.email
    const query={email:email}
    const user =await usersCollection.findOne(query)
    if(user?.role !== 'admin'){
       return res.status(403).send({error:true,message:'Unauthorized access!'})
    }
    next()
}


app.get('/allUsers',verifyJwt,verifyAdmin,async(req,res)=>{
    const result=await usersCollection.find().toArray()
    res.send(result)
})

app.delete('/user/:id',async(req,res)=>{
    const id=req.params.id
    const query = { _id: new ObjectId(id) };
    const result=await usersCollection.deleteOne(query)
    res.send(result)
})

//make admin

app.patch('/makeAdmin/:id',async(req,res)=>{
    const id=req.params.id
    const filter={_id: new ObjectId(id)}
    const options = { upsert: true };
    const user=req.body
    const updatedDoc ={
        $set: {
            role: user.role
         },
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
})

// get admin role 
app.get('/admin',verifyJwt,async(req,res)=>{
    const email=req.query.email
    if(!email){
        return res.send({ admin: false });
    }
    if(req.decoded?.email !== email){
        return res.send({ admin: false });
    }
    const query={email:email}
    const user =await usersCollection.findOne(query)
    const result={admin: user?.role==='admin'}
    res.send(result)
 })
// JWT TOKEN



// make instructor 
app.patch('/makeInstructor/:id',async(req,res)=>{
    const id=req.params.id
    const filter={_id: new ObjectId(id)}
    const options = { upsert: true };
    const user=req.body
    const updatedDoc ={
        $set: {
            role: user.role
         },
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
})

// add class by instructor

app.post('/classes',async(req,res)=>{
    const newClass = req.body
    const result=await ClassesCollection.insertOne(newClass)
    res.send(result)
})

app.post('/jwt',async(req,res)=>{
    const body =req.body
    const token=jwt.sign(body,process.env.JWT_TOKEN,{
        expiresIn: "1h",
      })
      res.send({token})
})

// get instructor role
app.get('/instructor',verifyJwt,async(req,res)=>{
    const email=req.query.email
    if(!email){
        return res.send({ instructor: false });
    }
    if(req.decoded?.email !== email){
        return res.send({ instructor: false });
    }
    const query={email:email}
    const user =await usersCollection.findOne(query)
    const result={instructor: user?.role==='instructor'}
    res.send(result)
 })

// get instructor added class

app.get('/instructorClass',verifyJwt,async(req,res)=>{
    const email =req.query?.email
   
    if (!email) {
      return res
        .status(403)
        .send({ error: "No classes found" });
    }
    if (req.decoded?.email !== email) {
      return res.status(403).send({ error: "Unauthorized access!" });
    }
    const filter ={email:email}
    const result =await ClassesCollection.find(filter).toArray()
    res.send(result)
})


//  get user role 
app.get('/user',verifyJwt,async(req,res)=>{
    const email=req.query.email
    if(req.decoded?.email !== email){
        return res.send({ admin: false });
    }
    const query={email:email}
    const user =await usersCollection.findOne(query)
    const result={user: user?.role==='user'}
    res.send(result)
 })

//  create payment intent 
app.post('/create-payment-intent',async(req,res)=>{
    const body =req.body
    const price =body.price
    const amount =price * 100
    const paymentIntent =await stripe.paymentIntents.create({
        amount:amount,
        currency:'usd',
        payment_method_types:['card']
    })
    res.send({ clientSecret: paymentIntent.client_secret})
})


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Assignment 12 running')
})

app.listen(port,()=>{
    console.log('server is running port',port);
})