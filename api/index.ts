import { toLambda } from "probot-serverless-now";
import app from "../lib/index";
module.exports = toLambda(app);
