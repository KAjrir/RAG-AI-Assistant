import { neon } from "@neondatabase/serverless";
import { config } from "dotenv"

config({
  path: "../.env"
});

export default neon(process.env.DATABASE_URL);
