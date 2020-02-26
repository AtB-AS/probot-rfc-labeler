import { toLambda } from "probot-serverless-now";
import app from "../lib/index";

console.log("Starting serverless probot.");
export default toLambda(app);
