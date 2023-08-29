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


async function getUnmanaged() {
  const devices = (
    await (
      await fetch("https://or-efraim1.hexnodemdm.com/api/v1/devices/", {
        headers: { Authorization: process.env.API_KEY },
      })
    ).json()
  ).results;

  return (await Promise.all(devices.map(async (x) => {
    if (x.os_name != "iOS") {
      return false;
    }

    const device = await (
      await fetch(
        `https://or-efraim1.hexnodemdm.com/api/v1/devices/${x.id}/applications/`,
        {
          headers: { Authorization: process.env.API_KEY },
        }
      )
    ).json();

   // console.log(device);

    const apps = device.results
      .filter((x) => x.managed === false)
      .map((x) => x.name);

    //console.log(apps)

    console.log({
      name: x.device_name,
      apps,
    })

    if(!apps.length) return false

    return {
      name: x.device_name,
      apps,
    };
  }))).filter(x => x);
}

app.get("/last_reported", async (req, res) => {
  return res.json(await getReport());
});

app.get("/unmanaged", async (req, res) => {
  return res.json(await getUnmanaged());
});

const port = process.env.PORT;
app.listen(port, () => console.log(`listening on port ${port}...`));
