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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getUnmanaged() {
  const devices = (
    await (
      await fetch("https://or-efraim1.hexnodemdm.com/api/v1/devices/", {
        headers: { Authorization: process.env.API_KEY },
      })
    ).json()
  ).results;

  const unmanagedDevices = [];

  for (const device of devices) {
    if (device.os_name === "iOS") {
      const deviceApps = await (
        await fetch(
          `https://or-efraim1.hexnodemdm.com/api/v1/devices/${device.id}/applications/`,
          {
            headers: { Authorization: process.env.API_KEY },
          }
        )
      ).json();

      const unmanagedApps = deviceApps.results
        .filter((app) => app.managed === false)
        .map((app) => app.name);

      if (unmanagedApps.length > 0) {
        unmanagedDevices.push({
          name: device.device_name,
          apps: unmanagedApps,
        });
      }
    }
    await delay(1000);
  }

  return unmanagedDevices;
}

app.get("/last_reported", async (req, res) => {
  return res.json(await getReport());
});

app.get("/unmanaged", async (req, res) => {
  return res.json(await getUnmanaged());
});

const port = process.env.PORT;
app.listen(port, () => console.log(`listening on port ${port}...`));





