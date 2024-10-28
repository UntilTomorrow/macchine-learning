const fs = require("fs");
const readline = require("readline");
const { exec } = require("child_process");
const stringSimilarity = require("string-similarity");

function loadKnowledgeBase(filepath) {
  try {
    const data = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    return data;
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    return [];
  }
}

function findRelevantContext(question) {
  const data = loadKnowledgeBase("learn.json");
  const questions = data.map((item) => item.question);
  const matches = stringSimilarity.findBestMatch(question, questions);

  const bestMatches = matches.ratings
    .filter((match) => match.rating >= 0.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  if (bestMatches.length > 0) {
    const context = bestMatches
      .map((match) => {
        const qna = data.find((item) => item.question === match.target);
        return `${qna.question}: ${qna.answer}`;
      })
      .join("\n");

    return context;
  }

  return "Informasi relevan tidak ditemukan di knowledge base, mohon maaf.";
}

function sendToLlamaWithContext(question, context) {
  return new Promise((resolve, reject) => {
    const prompt = `${context}\n\n${question}`;

    console.log(prompt);

    const modelName = "llama3.2:latest";
    exec(`ollama run ${modelName} "${prompt}"`, (error, stdout, stderr) => {
      if (error) {
        reject(`Execution Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function getAnswer(question) {
  const context = findRelevantContext(question);
  try {
    const answer = await sendToLlamaWithContext(question, context);
    console.log(answer);
  } catch (error) {
    console.error("Error fetching answer:", error);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Tanyakan sesuatu> ",
});

rl.prompt();

rl.on("line", (line) => {
  const question = line.trim();
  if (question) {
    getAnswer(question);
  }
  rl.prompt();
}).on("close", () => {
  console.log("Sampai jumpa!");
  process.exit(0);
});
