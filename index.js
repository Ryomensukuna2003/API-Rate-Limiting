import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import { limiter } from "./middleware/Rate_limit.js";

const app = express();

app.use(bodyParser.json());
app.use(limiter(5,60));

app.get("/", (req, res) => {
  console.log("Helowww");
  return res.json({ message: "Heloww" });
});

app.listen(process.env.PORT, () => {
  console.log(`Running on ${process.env.PORT}`);
});
