const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = 3000;
const stripe = require("stripe")(process.env.STRIP_SECRETE);
const crypto = require("crypto");

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
    const requestCollections = database.collection("request");
    const paymentCollections = database.collection("payment");

    // post user data
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      userInfo.createdAt = new Date();

      const result = await userCollections.insertOne(userInfo);
      res.send(result);
    });

    // get all users
    app.get("/users", async (req, res) => {
      const result = await userCollections.find().toArray();
      res.send(result);
    });

    // get user by email
    app.get("/users/:email", async (req, res) => {
      const { email } = req.params;

      const query = { email: email };
      const result = await userCollections.findOne(query);
      res.send(result);
      console.log(result);
    });

    // post donation request
    app.post("/create-donation-request", async (req, res) => {
      const data = req.body;
      data.createdAt = new Date();
      const result = await requestCollections.insertOne(data);
      res.send(result);
    });

    // get donation request
    app.get("/create-donation-request", async (req, res) => {
      const result = await requestCollections.find().toArray();
      res.send(result);
    });

    // get donation request by email
    app.get("/my-requests", async (req, res) => {
      const userEmail = req.query.email;
      const query = { requesterEmail: userEmail };
      const result = await requestCollections.find(query).toArray();
      res.send(result);
    });

    // get donation request by id
    app.get("/donation-request/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);

      const query = { _id: new ObjectId(id) };
      const result = await requestCollections.findOne(query);
      res.send(result);
    });

    // update user status
    app.patch("/update/user-status", async (req, res) => {
      const { email, status } = req.query;
      const query = { email: email };

      const updateStatus = {
        $set: {
          status: status,
        },
      };
      const result = await userCollections.updateOne(query, updateStatus);
      res.send(result);
    });

    // update user role
    app.patch("/update/user-role", async (req, res) => {
      const { email, role } = req.query;
      const query = { email: email };

      const updateRole = {
        $set: {
          role: role,
        },
      };
      const result = await userCollections.updateOne(query, updateRole);
      res.send(result);
    });

    // update donation status
    const { ObjectId } = require("mongodb");

    app.patch("/update/donation-status/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const query = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: { status: status },
      };

      const result = await requestCollections.updateOne(query, updateStatus);
      res.send(result);
    });

    // update request
    app.put("/update/request/:id", async (req, res) => {
      const data = req.body;
      const id = req.params;
      const query = { _id: new ObjectId(id) };

      const updateRequest = {
        $set: data,
      };

      const result = await requestCollections.updateOne(query, updateRequest);
      res.send(result);
    });

    // delete request
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await requestCollections.deleteOne(query);
      res.send(result);
    });

    // update profile
    app.put("/update/profile/:email", async (req, res) => {
      const data = req.body;
      const { email } = req.params;
      const query = { email: email };

      const updateUser = {
        $set: data,
      };

      const result = await userCollections.updateOne(query, updateUser);
      res.send(result);
    });

    // payment
    app.post("/create-payment-checkout", async (req, res) => {
      const information = req.body;
      const amount = parseInt(information.donateAmount) * 100;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: "Please Donate to DonateX",
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          donorName: information?.donorName,
        },
        customer_email: information?.donorEmail,
        success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/payment-cancelled`,
      });
      res.send({ url: session.url });
    });

    // post success payment data
    app.post("/success-payment", async (req, res) => {
      const { session_id } = req.query;
      const session = await stripe.checkout.sessions.retrieve(session_id);
      console.log(session);

      const transactionId = session.payment_intent;

      const isPaymentExist = await paymentCollections.findOne({ transactionId });

      if (isPaymentExist) {
        return;
      }

      if (session.payment_status == "paid") {
        const paymentInfo = {
          amount: session.amount_total / 100,
          currency: session.currency,
          donorEmail: session.customer_email,
          transactionId,
          paymentStatus: session.payment_status,
          paidAt: new Date(),
        };
        const result = await paymentCollections.insertOne(paymentInfo);
        return res.send(result);
      }
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
