const express =require('express')
const cors=require('cors')
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
    const authorization =req.headers.authorization
    if(!authorization){
        res.status(401).send({error:true,message:'Unauthorized access!'})
    }
    const token=authorization.split(' ')[1]
    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded)=> {
        if(err){
            res.status(401).send({error:true,message:'Unauthorized access!'})
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

app.put('/update/:id',async(req,res)=>{
    const id = req.params.id
    
    const filter={_id: new ObjectId(id)}
    const options = { upsert: true };
    const updateData=req.body
    const updatedDoc ={
        $set: {
            availableSeats:updateData.remaining
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


// JWT TOKEN

app.post('/jwt',async(req,res)=>{
    const body =req.body
    const token=jwt.sign(body,process.env.JWT_TOKEN,{
        expiresIn: "1h",
      })
      res.send({token})
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