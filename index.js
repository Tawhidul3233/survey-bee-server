const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || "5000";

// middlewares
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// run mongodb
async function dbConnect() {
  try {
    // await client.connect();
    // console.log("database connected");

    // database collections here
    const usersCollection = client.db("surveyBee").collection("users");
    const tempSurveyAudienceCollection = client
      .db("surveyBee")
      .collection("tempSurveyAudience");

    // users post to db
    app.put("/users", async (req, res) => {
      try {
        const user = req.body;
        const email = user.email;
        const filter = { email };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            userName: user.userName,
          },
        };
        const result = await usersCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        if (result.acknowledged) {
          res.send(result);
        }
      } catch (error) {
        console.log(error);
        res.send(error.message);
      }
    });

    // survey audience get by id
    app.get("/specificSurveyAudience/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // console.log(id);
        const query = { _id: ObjectId(id) };
        // console.log(query);
        const specificSurveyAudience =
          await tempSurveyAudienceCollection.findOne(query);
        // console.log(specificSurveyAudience);
        res.send(specificSurveyAudience);
      } catch (error) {
        console.log(error);
      }
    });
  } finally {
  }
}
dbConnect().catch((err) => console.log(err));

// test server endpoint
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: " server is ready to use",
  });
});

app.listen(port, () => {
  console.log(` server is running on: ${port}`);
});
