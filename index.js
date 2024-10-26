const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const stringSimilarity = require("string-similarity");

const API_TOKEN = "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";
const model = "bert-large-uncased-whole-word-masking-finetuned-squad";

function findanswerlearnjson(question) {
  const data = JSON.parse(fs.readFileSync("learn.json"));

  const questions = data.map((item) => item.question);
  const matches = stringSimilarity.findBestMatch(question, questions);

  if (matches.bestMatch.rating >= 0.7) {
    const bestMatchQuestion = matches.bestMatch.target;
    const qna = data.find((item) => item.question === bestMatchQuestion);
    return qna ? qna.answer : null;
  }
  return null;
}

function createfromlearnjson() {
  const data = JSON.parse(fs.readFileSync("learn.json"));
  return data.map((item) => `${item.question}: ${item.answer}`).join(" ");
}

async function answermodelai(question, context) {
  try {
    const response = await axios({
      method: "post",
      url: `https://api-inference.huggingface.co/models/${model}`,
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      data: {
        inputs: {
          question: question,
          context: context,
        },
      },
    });

    return response.data.answer;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

async function getAnswer(question) {
  let answer = findanswerlearnjson(question);

  if (answer) {
    console.log("Answer from learn.json:", answer);
  } else {
    const context = createfromlearnjson();
    answer = await answermodelai(question, context);
    console.log("Answer from Hugging Face API:", answer);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Ask a question> ",
});

rl.prompt();

rl.on("line", (line) => {
  const question = line.trim();
  if (question) {
    getAnswer(question);
  } else {
    console.log("Please type a question.");
  }
  rl.prompt();
}).on("close", () => {
  console.log("Goodbye!");
  process.exit(0);
});
