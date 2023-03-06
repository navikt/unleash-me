import { getFeaturesForUser, setToggle } from "./unleash-api.js";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

// TODO: Testdata, remove
const userId = "BJORN";
const env = "development";

const createServer = async () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/features", async (_req, res) => {
    const features = await getFeaturesForUser(userId, env);
    res.send(features);
  });

  app.post("/features", async (req, res) => {
    const { featureName, strategyId, enabled } = req.body;

    setToggle(env, userId, featureName, strategyId, enabled)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  return { app };
};

createServer().then(({ app }) => {
  app.listen(8080, () => {
    console.log(`Server listening on port ${8080}`);
  });
});
