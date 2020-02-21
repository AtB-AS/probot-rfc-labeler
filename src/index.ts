import { Application, Context, Octokit } from "probot";
import createScheduler from "probot-scheduler";
import Labeler, { LabelerOptions } from "./labeler";

import Webhooks from "@octokit/webhooks";

type PullCollectionType =
  | Webhooks.WebhookPayloadPullRequestPullRequest
  | Octokit.PullsGetResponse;

export = async (app: Application) => {
  // Visit all repositories to mark and sweep stale issues
  const scheduler = createScheduler(app, {
    delay: false
  });

  // Unmark stale issues if a user comments
  const events = [
    "issue_comment",
    "pull_request",
    "pull_request_review",
    "pull_request_review_comment"
  ];

  app.on(events, unmark);
  app.on("schedule.repository", mark);

  function isPullItem(
    pr: any
  ): pr is Octokit.SearchIssuesAndPullRequestsResponseItemsItem {
    return "comments_url" in pr && "id" in pr && "url" in pr;
  }

  async function unmark(context: Context<Webhooks.WebhookPayloadPullRequest>) {
    if (!context.isBot) {
      const labeler = await forRepository(context);
      let pr: PullCollectionType =
        context.payload.pull_request ?? (context.payload as any).issue;

      // Some payloads don't include labels
      if (!pr.labels) {
        try {
          pr = (await context.github.pulls.get(context.issue()))
            .data as Octokit.PullsGetResponse;
        } catch (error) {
          context.log("Issue not found");
        }
      }

      let timeoutLabelAdded = false;
      if (context.payload.action === "labeled") {
        const casted = context.payload as any;
        timeoutLabelAdded = casted.label?.name === labeler.config.timeoutLabel;
      }

      if (!isPullItem(pr)) {
        return;
      }

      if (
        labeler.hasTimedoutLabel(pr) &&
        pr.state !== "closed" &&
        !timeoutLabelAdded
      ) {
        labeler.unmarkIssue(pr);
      }
    }
  }

  async function mark(context: Context) {
    const stale = await forRepository(context);
    await stale.doMark();
  }

  async function forRepository(
    context: Context<Webhooks.WebhookPayloadPullRequest>
  ) {
    let config = await context.config<LabelerOptions>("rfc-labeler.yml");

    if (!config) {
      scheduler.stop(context.payload.repository);
      // Don't actually perform for repository without a config
      config = { perform: false };
    }

    config = Object.assign(config, context.repo({ logger: app.log }));

    return new Labeler(context.github, config as LabelerOptions);
  }
};
