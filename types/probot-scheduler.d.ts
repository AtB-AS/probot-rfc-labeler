declare module "probot-scheduler" {
  export default function createScheduler(
    app: import("probot").Application
  ): {
    stop(repo: import("@octokit/webhooks").PayloadRepository): void;
  };
}
