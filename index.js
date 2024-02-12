import dayjs from "dayjs";
import { config } from "dotenv";
config();
import express from "express";
const app = express();
app.use(express.json());

import fetch from "node-fetch";

const appList = {};


async function getDevices() {
  const res = await fetch("https://or-efraim1.hexnodemdm.com/api/v1/devices/", {
    headers: { Authorization: process.env.API_KEY },
  });
  return (await res.json()).results;
}

async function getDeviceDetails(id) {
  const res = await fetch(
    `https://or-efraim1.hexnodemdm.com/api/v1/devices/${id}/`,
    {
      headers: { Authorization: process.env.API_KEY },
    }
  );
  return await res.json();
}

/**
 *
 * @param {Array<number>} ids
 * @param {String} message
 */
async function sendMessage(ids, message) {
  const res = await fetch(
    "https://or-efraim1.hexnodemdm.com/api/v1/actions/message/",
    {
      headers: {
        Authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        users: [],
        usergroups: [],
        devices: ids,
        devicegroups: [],
        message: message,
      }),
    }
  );
}

async function changeOwner(user, ids) {
  const res = await fetch(
    "https://or-efraim1.hexnodemdm.com/api/v1/actions/change_owner/",
    {
      headers: {
        Authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        user: user,
        devices: ids,
      }),
    }
  );
}

async function changeName(id, name) {
  const res = await fetch(
    "https://or-efraim1.hexnodemdm.com/api/v1/actions/save_friendly_name/",
    {
      headers: {
        Authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        set_collective_name: false,
        friendly_name_list: [name],
        device_id_list: [id],
        use_suffix: true,
        suffix: 123,
      }),
    }
  );
}

async function removeDevices(ids) {
  const res = await fetch(
    "https://or-efraim1.hexnodemdm.com/api/v1/actions/mark_as_disenrolled/",
    {
      headers: {
        Authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        devices: ids,
      }),
    }
  );
}

async function installApps(ids, apps) {
  const res = await fetch(
    "https://or-efraim1.hexnodemdm.com/api/v1/actions/install_applications/",
    {
      headers: {
        Authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        apps: apps,
        devices: ids,
      }),
    }
  );
}

async function updateApplist(catalogId) {
  let page = 1;
  appList[catalogId] = [];

  const catalog = (
    await (
      await fetch(`https://or-efraim1.hexnodemdm.com/api/v1/appcatalogues/${catalogId}/`, {
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
   

    if(!res || !res.results) {
      console.log(res)
      break;
    }

    appList[catalogId] = appList[catalogId].concat(
      res.results.filter(x => x.platform === "ios").map((x) => ({
        ...x,
        installed: catalog.filter((e) => e.id === x.id).length > 0,
      }))
    );
    if (!res.next) break;
    page++;
  }

}

async function addApp(catalogId,id) {
  const res = await fetch(
    `https://or-efraim1.hexnodemdm.com/api/v1/appcatalogues/${catalogId}/`,
    {
      headers: {
        Authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        add_apps: [id],
        remove_apps: [],
        add_groups: [],
        remove_groups: [],
      }),
    }
  );
}

async function removeApp(catalogId,id) {
  console.log(id);
  const res = await fetch(
    `https://or-efraim1.hexnodemdm.com/api/v1/appcatalogues/${catalogId}/`,
    {
      headers: {
        Authorization: process.env.API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        add_apps: [],
        remove_apps: [id],
        add_groups: [],
        remove_groups: [],
      }),
    }
  );

  console.log(res);
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

async function addAppToGroup(appGroupId,appId) {
  const res = await fetch(`https://or-efraim1.hexnodemdm.com/api/v1/appgroups/${appGroupId}/`, {
    headers: { Authorization: process.env.API_KEY, "Content-Type": "application/json" },
    method:"POST",
    body:JSON.stringify({
      add_apps:[appId],
      remove_apps:[]
    })
  })
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

app.post("/add_app_to_group/:groupId/:appId",async (req,res) => {
  await addAppToGroup(req.params.groupId,req.params.appId);
  return res.json("ok")
})

app.get("/last_reported", async (req, res) => {
  return res.json(await getReport());
});

app.get("/unmanaged", async (req, res) => {
  return res.json(await getUnmanaged());
});

app.get("/app_list/:catalogId", async (req, res) => {
  
  return res.json(appList[req.params.catalogId] ?? []);
});

app.post("/update_app_list/:catalogId", async (req, res) => {
  await updateApplist(req.params.catalogId);
  return res.json("ok");
});

app.post("/add_app/:catalogId/:id", async (req, res) => {
  await addApp(req.params.catalogId,req.params.id);
  updateApplist(req.params.catalogId);
  return res.json("ok");
});

app.get("/devices", async (req, res) => {
  return res.json(await getDevices());
});

app.get("/device-details/:id", async (req, res) => {
  return res.json(await getDeviceDetails(req.params.id));
});

app.post("/send-message", async (req, res) => {
  await sendMessage(req.body.ids, req.body.message);
  return res.json("ok");
});

app.post("/change-owner", async (req, res) => {
  await changeOwner(req.body.user, req.body.ids);
  return res.json("ok");
});

app.post("/change-name", async (req, res) => {
  await changeName(req.body.id, req.body.name);
  return res.json("ok");
});

app.post("/remove-devices", async (req, res) => {
  await removeDevices(req.body.ids);
  return res.json("ok");
});

app.post("/install-apps", async (req, res) => {
  await installApps(req.body.ids, req.body.apps);
  return res.json("ok");
});


app.post("/remove_app/:catalogId/:id", async (req, res) => {
  await removeApp(req.params.catalogId,req.params.id);
  updateApplist(req.params.catalogId);
  return res.json("ok");
});

const port = process.env.PORT;
app.listen(port, () => console.log(`listening on port ${port}...`));
