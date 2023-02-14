const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
require("dotenv").config();
const app = express();

const port = process.env.PORT || "5000";

// middlewares
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true, useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// run mongodb
async function dbConnect() {
  try {
    // await client.connect();
    // console.log("database connected");
    // database collections here

    const usersCollection = client.db("surveyBee").collection("users");

    const tempSurveyAudienceCollection = client.db("surveyBee").collection("tempSurveyAudience");

    const userCreatedSurveyCollections = client.db("surveyBee").collection("usersCreatedSurveys");

    const surveyTemplateCategoryCollection = client.db("surveyBee").collection("templateCategorys");

    const surveyTemplateCollection = client.db("surveyBee").collection("surveyTemplate");



    // Oliullah vi start.....................

    // users post to mongodb
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
        const result = await usersCollection.updateOne(filter, updatedDoc, options);
        if (result.acknowledged) {
          res.send(result);
        }
      } catch (error) {
        console.log(error);
        res.send(error.message);
      }
    });


    // get specific user from mongodb
    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params?.email;
        const query = { email: email };
        const specificUser = await usersCollection.findOne(query);
        res.send(specificUser);
      } catch (error) {
        console.log(error);
      }
    });


    // update specific user profile......used clint site user Dashboard modal
    app.patch("/users/:id", async (req, res) => {
      try {
        const id = req.params?.id;
        const { firstName, lastName, jobRole, jobLevel } = req.body;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: false };
        const updatedDoc = {
          $set: {
            firstName,
            lastName,
            jobRole,
            jobLevel,
          },
        };
        const result = await usersCollection.updateOne(filter, updatedDoc, options);
        if (result.modifiedCount) {
          res.json({
            success: true,
            message: "Profile updated successfully",
            data: result,
          });
        } else {
          res.json({
            success: true,
            message: "Profile already updated",
            data: result,
          });
        }
      } catch (error) {
        console.log(error);
      }
    });


    // get admin
    app.get("/users/admin/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await usersCollection.findOne({ email });
        res.send({ isAdmin: user?.role === "admin" });
      } catch (error) {
        console.log(error);
        res.send(error.message);
      }
    });


    // save user survey questions
    app.post("/userCreatedSurveyQuestions", async (req, res) => {
      try {
        const info = req.body;
        const result = await userCreatedSurveyCollections.insertOne(info);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // update create survey questions
    app.put("/userCreatedSurveyQuestions", async (req, res) => {
      try {
        const surveyData = req.body;
        const createdSurveyUserId = surveyData?.id;
        const id = { _id: ObjectId(createdSurveyUserId) };
        const optionAnswer = surveyData?.optinoValue;
        const createdSurveyUserQuestion = surveyData?.questions;
        const createdSurveyUserQuestionType = surveyData?.questionType;
        const surveyModifiedTime = surveyData?.surveyModifiedTime;
        const questionsAndTypes = {
          questions: createdSurveyUserQuestion,
          questionsType: createdSurveyUserQuestionType,
          optionAnswers: optionAnswer
        };
        const filter = id;
        const options = { upsert: false };
        const updatedDoc = {
          $set: {
            surveyModifiedTime,
          },
          $push: {
            questionsAndTypes,
          },
        };
        const result = await userCreatedSurveyCollections.updateOne(filter,updatedDoc,options);
        if (result.acknowledged) {
          res.send(result);
        }
      } catch (error) {
        res.send(error.message);
      }
    });

    // update create survey questions after deleteing
    app.patch("/surveyQdelete", async (req, res) => {
      try {
        const { targetId, targetQuestion, targetQType } = req.body;
        // console.log(targetId, targetQuestion, targetQType);
        const filter = { _id: ObjectId(targetId) };
        const options = { upsert: false };
        const questionsAndTypes = {
          questions: targetQuestion,
          questionsType: targetQType,
        };
        const updatedDoc = {
          $pull: {
            questionsAndTypes,
          },
        };
        const result = await userCreatedSurveyCollections.updateOne(filter,updatedDoc,options);

        if (result?.modifiedCount) {
          res.send(result);
        } else {
          res.json({
            status: false,
            message: "Failed",
          });
        }
      } catch (error) {
        res.send(error.message);
      }
    });

    // get specific user last survey questions and show......used clint site recent survey
    app.get("/userCreatedSurveyQuestions/:email", async (req, res) => {
      try {
        const email = req.params?.email;
        const filter = {
          email,
        };
        const questions = await userCreatedSurveyCollections
          .find(filter)
          .sort({ surveyCreateTimeMl: -1 })
          .limit(1)
          .toArray();
        if (questions) {
          // res.send(questions.slice(-1));
          res.send(questions);
        }
      } catch (error) {
        res.send(error?.message);
      }
    });

    // get all survey for a specific user ...... Clint site My survey option used
    app.get("/userCreatedSurveyQuestions", async (req, res) => {
      try {
        const query = { email: req.query.email };
        const userCreatedSurvey = await userCreatedSurveyCollections
          .find(query)
          .sort({ surveyCreateTimeMl: -1 })
          .toArray();
        if (userCreatedSurvey) {
          res.json({
            status: true,
            message: "userCreatedSurvey got successfully",
            data: userCreatedSurvey,
          });
        } else {
          res.json({ status: false, message: "data got failed", data: [] });
        }
      } catch (error) {
        res.json({ status: false, message: error.message });
      }
    });

    // delete survey by user
    app.delete("/deleteSurvey/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // console.log(id);
        const query = { _id: new ObjectId(id) };
        // console.log(query);
        const deleteSurvey = await userCreatedSurveyCollections.deleteOne(
          query
        );
        if (deleteSurvey?.deletedCount) {
          res.send(deleteSurvey);
        }
      } catch (error) {
        console.log(error);
      }
    });

    // edit recent survey
    app.get("/editsurvey/:id", async (req, res) => {
      try {
        const id = req.params?.id;
        const survey = await userCreatedSurveyCollections.findOne({
          _id: ObjectId(id),
        });
        // console.log(survey);
        res.send(survey);
      } catch (error) {
        console.log(error);
      }
    });

    // Oliullah vi end .......................




    // Tuhin vi start ......................

    // get all survey audience
    app.get("/surveyAudience", async (req, res) => {
      try {
        const query = {};
        const result = await tempSurveyAudienceCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // survey audience get by id
    app.get("/specificSurveyAudience/:title/:id", async (req, res) => {
      try {
        const title = req.params.title;
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const specificSurveyAudience = await tempSurveyAudienceCollection.findOne(query);
        const specificdata = specificSurveyAudience.card.filter(
          (cardTitle) => title === cardTitle.title
        );
        res.send(specificdata);
      } catch (error) {
        console.log(error);
      }
    });

    //servey Category
    app.get("/surveyCategory", async (req, res) => {
      try {
        const query = {};
        const surveyTemplateCategory = await surveyTemplateCategoryCollection
          .find(query)
          .toArray();
        res.send(surveyTemplateCategory);
      } catch (error) {
        console.log(error);
      }
    });

    // get all survey template
    app.get("/surveyTemplate", async (req, res) => {
      try {
        const query = {};
        const surveyTemplate = await surveyTemplateCollection
          .find(query)
          .toArray();
        res.send(surveyTemplate);
      } catch (error) {
        console.log(error);
      }
    });

    // get specific survey template
    app.get("/surveyTemplate/:id", async (req, res) => {
      try {
        const id = req.params?.id;
        const query = { _id: ObjectId(id) };
        const surveyTemplate = await surveyTemplateCollection.findOne(query);
        res.send(surveyTemplate);
      } catch (error) {
        console.log(error);
      }
    });
  } finally {
  }
}


// Tuhin vi end ....................


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
