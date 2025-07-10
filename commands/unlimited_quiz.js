const { startQuiz } = require("../utils/quizFunctions");
module.exports = {
  data: {
    name: "unlimited_quiz",
    description: "Starts an unlimited AI or Real image quiz",
  },
  async execute(interaction) {
    await startQuiz(interaction, Infinity, true);
  },
};