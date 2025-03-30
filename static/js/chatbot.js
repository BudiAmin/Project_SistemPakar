// Chatbot functionality
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-message");

// Database pertanyaan dan jawaban
const chatDatabase = {
  "apa itu seal mechanic":
    "Seal mechanic adalah komponen karet yang berfungsi untuk mencegah kebocoran air dari bagian yang berputar pada pompa. Ketika seal rusak, biasanya akan terjadi kebocoran air dari badan pompa.",
  "cara merawat pompa air":
    "Perawatan pompa air meliputi: 1) Periksa kebocoran secara berkala, 2) Pastikan saringan/filter bersih, 3) Periksa suara dan getaran tidak normal, 4) Jangan biarkan pompa kering, 5) Lakukan pembersihan berkala setiap 3-6 bulan.",
  "apa penyebab suara bising":
    "Suara bising pada pompa air biasanya disebabkan oleh: 1) Bearing yang aus atau rusak, 2) Impeller yang tidak seimbang, 3) Kavitasi akibat tekanan rendah, 4) Kerikil atau kotoran dalam pompa, 5) Dinamo yang bermasalah.",
  "berapa tekanan normal pompa air ":
    "Tekanan normal pompa air rumah tangga biasanya berkisar antara 1-3 bar. Untuk pompa industri bisa mencapai 4-7 bar tergantung spesifikasi dan kebutuhan. Jika tekanan terlalu rendah bisa menyebabkan aliran air lemah.",
  "kapan harus ganti bearing":
    "Bearing pompa air perlu diganti ketika: 1) Terdengar suara bising atau gesekan, 2) Pompa bergetar tidak normal, 3) Putaran motor tidak stabil, 4) Usia pakai sudah lebih dari 2-3 tahun dengan penggunaan intensif.",
  "berapa suara normal pompa":
    "Pompa air normal biasanya memiliki tingkat kebisingan sekitar 40-60 dB. Jika suara melebihi 70 dB, kemungkinan ada masalah pada komponen pompa seperti bearing atau impeller.",
  "kenapa pompa cepat panas":
    "Pompa cepat panas bisa disebabkan oleh: 1) Ventilasi tidak memadai, 2) Hambatan pada pipa, 3) Tegangan listrik tidak stabil, 4) Bearing aus, 5) Kurangnya pelumasan, 6) Impeller tersumbat atau rusak.",
  "harga pompa air":
    "Harga pompa air bervariasi tergantung merek dan spesifikasi. Pompa air rumah tangga berkisar 300-800 ribu rupiah. Pompa semi jet 800 ribu - 1,5 juta rupiah. Pompa industri bisa mencapai jutaan rupiah.",
  "cara ganti seal mechanic":
    "Cara mengganti seal mechanic: 1) Buka casing pompa, 2) Lepas impeller, 3) Keluarkan seal lama dengan obeng, 4) Bersihkan dudukan seal, 5) Pasang seal baru dengan hati-hati, 6) Rakit kembali pompa, 7) Lakukan tes kebocoran.",
  "berapa rpm normal":
    "RPM normal untuk pompa air rumah tangga biasanya sekitar 2800-3000 RPM. Jika putaran di bawah 2000 RPM, kemungkinan ada masalah pada dinamo atau pasokan listrik.",
};

// Fuzzy search untuk menemukan jawaban terbaik
function findBestMatch(question) {
  question = question.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const key in chatDatabase) {
    let score = 0;
    const keyWords = key.split(" ");

    for (const word of keyWords) {
      if (question.includes(word)) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = key;
    }
  }

  // Jika tidak ada kecocokan atau skor terlalu rendah
  if (highestScore === 0) {
    return null;
  }

  return bestMatch;
}

// Fungsi untuk menampilkan pesan
function displayMessage(text, sender) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.classList.add(
    sender === "user" ? "user-message" : "bot-message"
  );
  messageElement.innerText = text;
  chatMessages.appendChild(messageElement);

  // Auto-scroll ke pesan terbaru
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi untuk memproses input pengguna
function processUserInput() {
  const userInput = chatInput.value.trim();

  if (userInput === "") {
    return;
  }

  // Tampilkan pesan pengguna
  displayMessage(userInput, "user");

  // Proses jawaban
  const bestMatch = findBestMatch(userInput);
  let botResponse;

  if (bestMatch) {
    botResponse = chatDatabase[bestMatch];
  } else {
    botResponse =
      "Maaf, saya tidak memiliki informasi tentang pertanyaan itu. Silakan tanyakan tentang pompa air, seal mechanic, atau perawatan pompa.";
  }

  // Delay singkat untuk membuat percakapan terasa alami
  setTimeout(() => {
    displayMessage(botResponse, "bot");
  }, 500);

  // Reset input
  chatInput.value = "";
}

// Function to initialize chat suggestion chips
function initializeChatSuggestions() {
  const suggestionsContainer = document.getElementById("chat-suggestions");
  if (!suggestionsContainer) return;

  // Common questions as suggestions
  const suggestions = [
    "Apa itu seal mechanic?",
    "Cara merawat pompa air",
    "Penyebab suara bising",
    "Tekanan normal pompa",
    "Kapan harus ganti bearing",
  ];

  // Create suggestion chips
  suggestions.forEach((text) => {
    const chip = document.createElement("div");
    chip.className = "suggestion-chip";
    chip.textContent = text;
    chip.addEventListener("click", () => {
      chatInput.value = text;
      processUserInput();
    });
    suggestionsContainer.appendChild(chip);
  });
}

// Event listeners
function setupChatEventListeners() {
  // Make sure elements exist before adding event listeners
  if (sendButton) {
    sendButton.addEventListener("click", processUserInput);
  }

  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        processUserInput();
      }
    });
  }
}

// Initialize chatbot on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check if chat elements exist
  if (document.getElementById("chat-messages")) {
    // Display welcome message
    displayMessage(
      "Selamat datang di Asisten Pompa Air. Silakan ajukan pertanyaan tentang pompa air atau permasalahannya.",
      "bot"
    );

    // Setup suggestions
    initializeChatSuggestions();

    // Setup event listeners
    setupChatEventListeners();
  }
});
