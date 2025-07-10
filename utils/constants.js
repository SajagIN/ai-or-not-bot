module.exports = {
  TOKEN: process.env.DISCORD_BOT_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  QUIZ_TIMEOUT: 30000,
  COMMANDS: [
    {
      name: 'quiz',
      description: 'Starts an AI or not image quiz',
      options: [
        {
          name: 'questions',
          description: 'Number of questions (1-10)',
          type: 4,
          required: true,
          min_value: 1,
          max_value: 10
        }
      ]
    },
    {
      name: 'unlimited_quiz',
      description: 'Starts an unlimited AI or not image quiz'
    }
  ]
};