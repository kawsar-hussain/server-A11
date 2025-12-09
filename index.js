const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.fmz6hpp.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("Assignment11");
    const userCollections = database.collection("users");

    // post user data
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      userInfo.role = "buyer";
      userInfo.createdAt = new Date();

      const result = await userCollections.insertOne(userInfo);
      res.send(result);
    });

    // get role by email
    app.get("/users/role/:email", async (req, res) => {
      const { email } = req.params;

      const query = { email: email };
      const result = await userCollections.findOne(query);
      res.send(result);
      console.log(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Developer!");
});

app.listen(port, () => {
  console.log(`sever is running on the port: ${port}`);
});
