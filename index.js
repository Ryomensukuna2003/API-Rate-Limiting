import express from "express";
import bodyParser from "body-parser";
import { configDotenv } from "dotenv";

const PORT = 3000;

configDotenv();

const app = express();
app.get("/", (req, res) => {
  console.log("Helowww");
});

app.listen(PORT, () => {
  console.log(`Running on ${process.env.PORT}`);
});
