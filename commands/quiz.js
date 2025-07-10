const { startQuiz } = require("../utils/quizFunctions");
module.exports = {
  data: {
    name: "quiz",
    description: "Starts an AI or Real image quiz",
    options: [
      {
        name: "questions",
        description: "Number of questions (1-20)",
        type: 4,
        required: true,
        min_value: 1,
        max_value: 20,
      },
    ],
  },
  async execute(interaction) {
    await startQuiz(
      interaction,
      interaction.options.getInteger("questions"),
      false
    );
  },
};