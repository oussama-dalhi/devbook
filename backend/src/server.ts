import { app } from "./app.js";

const port: number = 3000;
app.listen(port, () => {
  console.log(`Backend running on ${port}`);
});
