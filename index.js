import express from "express";
import bodyParser from "body-parser";

const PORT = 3000;

const app = express();
app.get("/", (req, res) => {
  console.log("Helowww");
});

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});
