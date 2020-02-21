# Probot: RFC Labeler

> A GitHub App built with [Probot](https://github.com/probot/probot) that labels RFC Pull Requests after a period of inactivity for lazy consensus.

Based on the [Probot Stale App](https://probot.github.io/apps/stale/).

---

If you do an open RFC repo with [lazy consensus](https://github.com/AtB-AS/org/blob/master/VOTING.md#lazy-consensus-timeout) it's good to have some sort of mechanism for reminding you that an RFC has reached consensus. This is that mechanism.

After 5 days (configurable) it is marked as `consensus`, which means it should be merged. Or that someone should do one last check.

---

## Usage

1. **[Configure the GitHub App](https://github.com/apps/stale)**
2. Create `.github/rfc-labeler.yml` based on the following template.
3. It will start scanning for stale issues and/or pull requests within an hour.

A `.github/rfc-labeler.yml` file is required to enable the plugin. The file can be empty, or it can override any of these default settings:

```yml
# Configuration for probot-rfc-labeler - https://github.com/AtB-AS/probot-rfc-labeler

# Number of days of inactivity before a Pull Request gets marked
daysUntilTimeout: 5

# Pull Requests with these labels will never be marked. Set to `[]` to disable
exemptLabels:
  - wip
  - elevated

# Only mark Pull Requests with these labels. Set to `[]` to disable
onlyLabels:
  - rfc

# Set to true to ignore PRs with an assignee (defaults to false)
exemptAssignees: false

# Label to use when marking as timed out (consensus reached)
timeoutLabel: consensus

# Comment to post when marking as stale. Set to `false` to disable
markComment: >
  Has this RFC reached consensus?
  The consesus time has come and has automatically been marked with the `consensus` label
  It should be closed or merged.

# Comment to post when removing the stale label.
# unmarkComment: >
#   Your comment here.

# Limit the number of actions per hour, from 1-30. Default is 30
limitPerRun: 30
```

## Why did only some pull requests get marked?

To avoid triggering abuse prevention mechanisms on GitHub, only 30 issues and pull requests will be marked or closed per hour. If your repository has more than that, it will just take a few hours or days to mark them all.

## How long will it take?

The app runs on a scheduled basis and in batches to avoid hitting rate limit ceilings.

This means that even after you initially install the GitHub configuration and add the `rfc-labeler.yml` file, you may not see it act immediately.

If the bot doesn't run within 24 hours of initial setup, feel free to [open an issue](https://github.com/probot/stale/issues/new) and we can investigate further.

## Why no auto merging?

The author feels having auto-merging would lead to a lack of control and a higher risk of something passing that shouldn't be. Also, it makes it harder to handle things like vacation etc.

## Deployment

TBA

## License

[ISC](LICENSE) - Based on https://probot.github.io/apps/stale/
