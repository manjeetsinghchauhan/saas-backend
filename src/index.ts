import { init } from "./server";

init().then(server => {
  server.start();
  console.log("Server running on %s", server.info.uri);
  console.log("Swagger Documentation available at: %s/docs", server.info.uri);
});
