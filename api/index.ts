import { toLambda } from "probot-serverless-now";
import app from "../lib/index";
export default toLambda(app);
