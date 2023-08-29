import dayjs from "dayjs";
import { config } from "dotenv";
import express from "express";
const app = express();
config();
import fetch from "node-fetch";

async function addAppToCatalog(id) {
  const res = await fetch(
    `https://or-efraim1.hexnodemdm.com/api/v1/applications/`,
    { headers: { Authorization: process.env.API_KEY }, method: "GET" }
  );

  return await res.json();
}

async function getReport() {
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

app.get("/", async (req, res) => {
  return res.json(await getReport());
});

app.listen(5555);

// (async () => {
//   console.log(await getReport());
// })();
