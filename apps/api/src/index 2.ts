import { createServer } from "node:http";
import { appManifest } from "@wargame/shared";

const port = Number(process.env.PORT ?? 4000);

const server = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      name: appManifest.name,
      status: "ok",
      message: "API scaffold ready. No game logic implemented yet."
    })
  );
});

server.listen(port, () => {
  console.log(`${appManifest.name} API listening on http://localhost:${port}`);
});
