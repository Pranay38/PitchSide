import { NextRequest } from "next/server.js";

const req = new NextRequest("http://localhost", {
  method: "POST",
  body: JSON.stringify({ hello: "world" })
});

req.json().then(console.log).catch(console.error);
