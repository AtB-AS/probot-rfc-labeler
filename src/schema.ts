import Joi from "@hapi/joi";

const fields = {
  daysUntilTimeout: Joi.number().description(
    "Number of days of inactivity before a Pull Request gets marked"
  ),

  exemptLabels: Joi.alternatives()
    .try(Joi.any().valid(null), Joi.array().single())
    .description(
      "Pull Requests with these labels will never be marked. Set to `[]` to disable"
    ),

  onlyLabels: Joi.alternatives()
    .try(Joi.any().valid(null), Joi.array().single())
    .description(
      "Only mark Pull Requests with these labels. Set to `[]` to disable"
    ),

  exemptAssignees: Joi.boolean().description(
    "Set to true to ignore issues with an assignee (defaults to false)"
  ),

  timeoutLabel: Joi.string().description(
    "Label to use when marking as timed out"
  ),

  markComment: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.any()
        .allow(false)
        .only()
    )
    .error(() => '"markComment" must be a string or false')
    .description(
      "Comment to post when marking as stale. Set to `false` to disable"
    ),

  unmarkComment: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.boolean()
        .allow(false)
        .only()
    )
    .error(() => '"unmarkComment" must be a string or false')
    .description(
      "Comment to post when removing the stale label. Set to `false` to disable"
    ),

  limitPerRun: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .error(() => '"limitPerRun" must be an integer between 1 and 30')
    .description(
      "Limit the number of actions per hour, from 1-30. Default is 30"
    )
};

export type SchemaType = {
  daysUntilTimeout: number;
  exemptLabels: string[];
  onlyLabels: string[];
  exemptAssignees: boolean;
  timeoutLabel: string;
  markComment: string;
  unmarkComment: string;
  limitPerRun: number;
  owner: string;
  repo: string;
  perform: boolean;
  _extends?: string;
};

const schema = Joi.object<SchemaType>().keys({
  daysUntilTimeout: fields.daysUntilTimeout.default(5),
  onlyLabels: fields.onlyLabels.default(["rfc"]),
  exemptLabels: fields.exemptLabels.default(["wip", "elevated"]),
  timeoutLabel: fields.timeoutLabel.default("timedout"),
  markComment: fields.markComment.default(
    "Is this RFC ready to be merged? If so, what is blocking it? " +
      "\n\nThis issue has been automatically marked as timedout " +
      "because it has not had recent activity. " +
      "It should be closed or merged."
  ),
  exemptAssignees: fields.unmarkComment.default(false),
  unmarkComment: fields.unmarkComment.default(false),
  limitPerRun: fields.limitPerRun.default(30),
  owner: Joi.string().description("Owner name on GitHub"),
  repo: Joi.string().description("Repository name on GitHub"),
  perform: Joi.boolean().default(!process.env.DRY_RUN),
  _extends: Joi.string().description("Repository to extend settings from")
});

export default schema;
