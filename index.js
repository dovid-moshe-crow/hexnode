import dayjs from "dayjs";
import { config } from "dotenv";
import express from "express";
const app = express();
config();
import fetch from "node-fetch";

async function getReport() {
  const res = await fetch("https://or-efraim1.hexnodemdm.com/api/v1/devices/", {
    headers: { Authorization: process.env.API_KEY },
  });
  return (await res.json()).results
    .filter((x) => dayjs().subtract(1, "day").isAfter(dayjs(x.last_reported)))
    .map((x) => x.device_name);
}

app.get("/last_reported", async (req, res) => {
  return res.json(await getReport());
});

const port = process.env.PORT;
app.listen(port, () => console.log(`listening on port ${port}...`));
