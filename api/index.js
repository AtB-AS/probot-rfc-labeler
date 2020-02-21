const { toLambda } = require("probot-serverless-now");
const app = require("../lib/index");
module.exports = toLambda(app);
