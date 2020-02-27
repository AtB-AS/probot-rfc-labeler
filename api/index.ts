import { toLambda } from "probot-serverless-now";
import app from "../src/index";

export default toLambda(app);
