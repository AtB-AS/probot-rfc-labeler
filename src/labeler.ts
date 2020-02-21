import schema, { SchemaType } from "./schema";
import { GitHubAPI } from "probot/lib/github";
import { Octokit } from "probot";
const maxActionsPerRun = 30;

export type LabelerOptions = {
  owner: string;
  repo: string;
  logger: Console;
} & SchemaType;

export default class Labeler {
  github: GitHubAPI;
  logger: Console;
  remainingActions: number;
  config: LabelerOptions;

  constructor(github: GitHubAPI, opts: LabelerOptions) {
    const { logger, ...config } = opts;
    this.github = github;
    this.logger = logger;
    this.remainingActions = 0;

    const { error, value } = schema.validate(config);

    this.config = value;
    const { owner, repo } = this.config;

    if (error) {
      this.logger.warn(
        { err: new Error(error.message), owner, repo },
        "Invalid config"
      );
    }
  }

  async doMark() {
    if (!this.config.perform) {
      return;
    }

    this.logger.info(this.config, `starting mark and sweep of pull requests`);

    const limitPerRun = this.config.limitPerRun ?? maxActionsPerRun;
    this.remainingActions = Math.min(limitPerRun, maxActionsPerRun);

    await this.mark();
  }

  async mark() {
    await this.ensureLabelExists();
    const result = await this.getTimeouted();
    await Promise.all(
      result.data.items.filter(Boolean).map(issue => this.markIssue(issue))
    );
  }

  getTimeouted() {
    const onlyLabels = this.config.onlyLabels;
    const timeoutLabel = this.config.timeoutLabel;
    const exemptLabels = this.config.exemptLabels;
    const exemptAssignees = this.config.exemptAssignees;
    const labels = [timeoutLabel].concat(exemptLabels);
    const queryParts = labels.map(label => `-label:"${label}"`);
    queryParts.push(...onlyLabels.map(label => `label:"${label}"`));
    queryParts.push("is:pr");
    queryParts.push(exemptAssignees ? "no:assignee" : "");

    const query = queryParts.join(" ");
    const days = this.config.daysUntilTimeout;
    return this.search(days, query);
  }

  search(days: number, query: string) {
    const { owner, repo } = this.config;
    const timestamp = this.since(days)
      .toISOString()
      .replace(/\.\d{3}\w$/, "");

    query = `repo:${owner}/${repo} is:open updated:<${timestamp} ${query}`;

    const params: Octokit.SearchIssuesAndPullRequestsParams = {
      q: query,
      sort: "updated",
      order: "desc",
      per_page: maxActionsPerRun
    };

    this.logger.info(params, "searching %s/%s for timed out rfcs", owner, repo);
    return this.github.search.issuesAndPullRequests(params);
  }

  async markIssue(issue: Octokit.SearchIssuesAndPullRequestsResponseItemsItem) {
    if (this.remainingActions === 0) {
      return;
    }
    this.remainingActions--;

    const { owner, repo } = this.config;
    const perform = this.config.perform;
    const timeoutLabel = this.config.timeoutLabel;
    const markComment = this.config.markComment;
    const number = issue.number;

    if (this.hasExemptLabel(issue)) {
      this.logger.info(
        "%s/%s#%d issue has exempt label, not adding label",
        owner,
        repo,
        number
      );
      return;
    }

    if (perform) {
      this.logger.info("%s/%s#%d is being marked", owner, repo, number);
      if (markComment) {
        await this.github.issues.createComment({
          owner,
          repo,
          number,
          body: markComment
        });
      }
      await this.github.issues.addLabels({
        owner,
        repo,
        number,
        labels: [timeoutLabel]
      });
      return;
    } else {
      this.logger.info(
        "%s/%s#%d would have been marked (dry-run)",
        owner,
        repo,
        number
      );
    }
  }

  async unmarkIssue(
    issue: Octokit.SearchIssuesAndPullRequestsResponseItemsItem
  ) {
    const { owner, repo } = this.config;
    const perform = this.config.perform;
    const timeoutLabel = this.config.timeoutLabel;
    const unmarkComment = this.config.unmarkComment;
    const number = issue.number;

    if (perform) {
      this.logger.info("%s/%s#%d is being unmarked", owner, repo, number);

      if (unmarkComment) {
        await this.github.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body: unmarkComment
        });
      }

      return this.github.issues
        .removeLabel({ owner, repo, issue_number: number, name: timeoutLabel })
        .catch(err => {
          // ignore if it's a 404 because then the label was already removed
          if (err.code !== 404) {
            throw err;
          }
        });
    } else {
      this.logger.info(
        "%s/%s#%d would have been unmarked (dry-run)",
        owner,
        repo,
        number
      );
    }
  }

  // Returns true if at least one exempt label is present.
  hasExemptLabel(issue: Octokit.SearchIssuesAndPullRequestsResponseItemsItem) {
    const exemptLabels = this.config.exemptLabels;
    return issue.labels.some(label => exemptLabels.includes(label.name));
  }

  hasTimedoutLabel(
    issue: Octokit.SearchIssuesAndPullRequestsResponseItemsItem
  ) {
    const timeoutLabel = this.config.timeoutLabel;
    return issue.labels.map(label => label.name).includes(timeoutLabel);
  }

  async ensureLabelExists() {
    const { owner, repo } = this.config;
    const timeoutLabel = this.config.timeoutLabel;

    return this.github.issues
      .getLabel({ owner, repo, name: timeoutLabel })
      .catch(() => {
        return this.github.issues.createLabel({
          owner,
          repo,
          name: timeoutLabel,
          color: "A2AD00"
        });
      });
  }

  since(days: number) {
    const ttl = days * 24 * 60 * 60 * 1000;
    let date = new Date(new Date().getTime() - ttl);

    // GitHub won't allow it
    if (date < new Date(0)) {
      date = new Date(0);
    }
    return date;
  }
}
