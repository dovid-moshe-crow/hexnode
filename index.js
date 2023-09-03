import dayjs from "dayjs";
import { config } from "dotenv";
import express from "express";
const app = express();
config();
import fetch from "node-fetch";

let appList = [];

async function updateApplist() {
  let page = 1;
  appList = [];

  const catalog = (
    await (
      await fetch("https://or-efraim1.hexnodemdm.com/api/v1/appcatalogues/9/", {
        headers: { Authorization: process.env.API_KEY },
      })
    ).json()
  ).apps;

  while (true) {
    const res = await (
      await fetch(
        `https://or-efraim1.hexnodemdm.com/api/v1/applications/?page=${page}`,
        {
          headers: { Authorization: process.env.API_KEY },
        }
      )
    ).json();
    appList = appList.concat(
      res.results.map((x) => ({
        ...x,
        installed: catalog.filter((e) => e.id === x.id).length > 0,
      }))
    );
    if (!res.next) break;
    page++;
  }
}

async function addApp(id) {
  console.log(id)
  const res = await fetch("https://or-efraim1.hexnodemdm.com/api/v1/appcatalogues/9/", {
    headers: { Authorization: process.env.API_KEY, "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({
      add_apps: [id],
      remove_apps: [],
      add_groups: [],
      remove_groups: [],
    }),
  });

  console.log(res)
}

async function getReport() {
  const res = await fetch("https://or-efraim1.hexnodemdm.com/api/v1/devices/", {
    headers: { Authorization: process.env.API_KEY },
  });
  return (await res.json()).results
    .filter((x) => dayjs().subtract(1, "day").isAfter(dayjs(x.last_reported)))
    .map((x) => x.device_name);
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

app.get("/app_list", async (req, res) => {
  return res.json(appList);
});

app.post("/update_app_list", async (req, res) => {
  await updateApplist();
  return res.json("ok");
});

app.post("/add_app/:id", async (req, res) => {
  await addApp(req.params.id);
  await updateApplist();
  return res.json("ok");
});

const port = process.env.PORT;
app.listen(port, () => console.log(`listening on port ${port}...`));
