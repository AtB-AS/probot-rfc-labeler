declare module "probot-scheduler" {
  export default function createScheduler(
    app: import("probot").Application,
    options: {
      delay?: boolean;
      interval?: number;
    }
  ): {
    stop(repo: import("@octokit/webhooks").PayloadRepository): void;
  };
}
