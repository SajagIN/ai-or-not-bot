const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");
const { QUIZ_TIMEOUT } = require("./constants");
const activeQuizzes = new Map();

async function startQuiz(interaction, total, unlimited) {
  const user = interaction.user.id;
  if (activeQuizzes.has(user))
    return interaction.reply({
      content: "Quiz already running",
      ephemeral: true,
    });
  await interaction.deferReply();
  activeQuizzes.set(user, {
    score: 0,
    current: 0,
    total,
    unlimited,
    stopped: false,
    questions: [],
    used: new Set(),
    msgId: null,
    collector: null,
  });
  const data = await getQuestion(interaction.channel, user);
  if (!data) {
    activeQuizzes.delete(user);
    return interaction.editReply("Failed to start quiz");
  }
  const sent = await interaction.editReply({
    embeds: data.embeds,
    components: data.components,
  });
  activeQuizzes.get(user).msgId = sent.id;
  attachCollector(sent, user);
}

async function getQuestion(channel, user) {
  const q = activeQuizzes.get(user);
  if (!q || q.stopped) return null;
  q.current++;
  const isAI = Math.random() < 0.5;
  const type = isAI ? "ai" : "human";
  let url = "";
  for (let i = 0; i < 10; i++) {
    try {
      url = isAI
        ? `https://thispersondoesnotexist.com/?${Date.now()}`
        : (
            await axios.get(
              `https://thispersonexists.net/data/${Math.floor(
                Math.random() * 65212
              )}.json`
            )
          ).data.photo_url;
      if (!q.used.has(url)) {
        q.used.add(url);
        break;
      }
    } catch {}
  }
  if (!url) return null;
  q.questions.push({ type, answered: false });
  const embed = new EmbedBuilder()
    .setTitle(
      `Ai or Not? \n Q ${q.current}/${q.total === Infinity ? "∞" : q.total}`
    )
    .setImage(url)
    .setColor("#0099ff");
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ans_${user}_ai`)
      .setLabel("AI 🤖")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ans_${user}_human`)
      .setLabel("Human 👨")
      .setStyle(ButtonStyle.Success)
  );
  if (q.unlimited)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`stop_${user}`)
        .setLabel("Stop 🛑")
        .setStyle(ButtonStyle.Secondary)
    );
  return { embeds: [embed], components: [row] };
}

function attachCollector(message, user) {
  const q = activeQuizzes.get(user);
  if (q.collector) q.collector.stop();
  const collector = message.createMessageComponentCollector({
    filter: (i) => i.customId.includes(`_${user}_`),
    time: QUIZ_TIMEOUT,
    max: 1,
  });
  q.collector = collector;
  collector.on("end", async (col) => {
    if (q.stopped) return;
    if (col.size === 0 && !q.questions[q.current - 1].answered) {
      q.questions[q.current - 1].answered = true;
      await message.edit({
        content: `Time up: ${q.questions[q.current - 1].type}`,
        embeds: [],
        components: [],
      });
      proceed(message, user);
    }
  });
}

async function handleButton(interaction) {
  const [act, user, choice] = interaction.customId.split("_");
  if (interaction.user.id !== user)
    return interaction.reply({ content: "Not yours", ephemeral: true });
  const q = activeQuizzes.get(user);
  if (!q) return interaction.reply({ content: "No quiz", ephemeral: true });
  await interaction.update({
    embeds: interaction.message.embeds,
    components: interaction.message.components,
  });
  const msg = await interaction.channel.messages.fetch(q.msgId);
  if (act === "stop") {
    q.stopped = true;
    await msg.edit({
      content: `Quiz Stopped \n Score 🎉: ${q.score}/${q.current}`,
      embeds: [],
      components: [],
    });
    return activeQuizzes.delete(user);
  }
  const idx = q.current - 1;
  if (q.questions[idx].answered) return;
  const correct = q.questions[idx].type === choice;
  if (correct) q.score++;
  q.questions[idx].answered = true;
  const fb = new EmbedBuilder()
    .setColor(correct ? "#00ff00" : "#ff0000")
    .setDescription(correct ? "Correct 🎉" : "Wrong ❌")
    .setTimestamp();
  await msg.edit({ embeds: [fb], components: [] });
  proceed(msg, user);
}

async function proceed(message, user) {
  const q = activeQuizzes.get(user);
  if (q.stopped) return;
  if (q.current < q.total) {
    await new Promise((r) => setTimeout(r, 2000));
    const data = await getQuestion(message.channel, user);
    if (!data) return;
    await message.edit({ embeds: data.embeds, components: data.components });
    attachCollector(message, user);
  } else {
    await message.edit({
      content: `Your Score: ${q.score}/${q.total}`,
      embeds: [],
      components: [],
    });
    activeQuizzes.delete(user);
  }
}

module.exports = { startQuiz, handleButton };