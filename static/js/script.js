// Update slider values
document.getElementById("suara_pompa").addEventListener("input", function () {
  document.getElementById("suara_value").textContent = this.value + " dB";
});

document.getElementById("tekanan_air").addEventListener("input", function () {
  document.getElementById("tekanan_value").textContent = this.value + " Bar";
});

document.getElementById("putaran_motor").addEventListener("input", function () {
  document.getElementById("putaran_value").textContent = this.value + " RPM";
});

// Component info tooltips
const components = document.querySelectorAll(".component");
components.forEach((component) => {
  component.addEventListener("mouseenter", function () {
    const infoId = this.getAttribute("data-component") + "-info";
    const infoBox = document.getElementById(infoId);
    infoBox.style.display = "block";
    infoBox.style.top = this.offsetTop + 30 + "px";
    infoBox.style.left = this.offsetLeft + 30 + "px";
  });

  component.addEventListener("mouseleave", function () {
    const infoId = this.getAttribute("data-component") + "-info";
    document.getElementById(infoId).style.display = "none";
  });
});

// Toggle sidebar sections
document
  .getElementById("history-toggle")
  .addEventListener("click", function (e) {
    e.preventDefault();
    const historySection = document.getElementById("history-section");
    historySection.style.display =
      historySection.style.display === "none" ? "block" : "none";
    document.getElementById("chatbot-section").style.display = "none";
  });

document
  .getElementById("chatbot-toggle")
  .addEventListener("click", function (e) {
    e.preventDefault();
    const chatbotSection = document.getElementById("chatbot-section");
    chatbotSection.style.display =
      chatbotSection.style.display === "none" ? "block" : "none";
    document.getElementById("history-section").style.display = "none";
  });

document.getElementById("close-chat").addEventListener("click", function () {
  document.getElementById("chatbot-section").style.display = "none";
});

// Simpan riwayat diagnosis
function saveToHistory(diagnosisData) {
  // Ambil riwayat dari localStorage atau inisialisasi jika kosong
  let history = JSON.parse(localStorage.getItem("diagnosisHistory")) || [];

  // Tambahkan timestamp
  diagnosisData.timestamp = new Date().toLocaleString();

  // Tambahkan ke array riwayat
  history.unshift(diagnosisData); // Tambahkan di awal array

  // Batasi jumlah riwayat (misal 10 terakhir)
  if (history.length > 10) {
    history = history.slice(0, 10);
  }

  // Simpan kembali ke localStorage
  localStorage.setItem("diagnosisHistory", JSON.stringify(history));

  // Perbarui tampilan riwayat
  updateHistoryDisplay();
}

// Tampilkan riwayat
function updateHistoryDisplay() {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("diagnosisHistory")) || [];

  if (history.length === 0) {
    historyList.innerHTML = "<p>Belum ada riwayat diagnosis.</p>";
    return;
  }

  history.forEach((item, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.dataset.index = index;

    let statusClass = "";
    if (item.hasil < 40) statusClass = "text-success";
    else if (item.hasil < 60) statusClass = "text-warning";
    else statusClass = "text-danger";

    historyItem.innerHTML = `
            <div class="d-flex justify-content-between">
                <span class="${statusClass} fw-bold">${item.hasil}%</span>
                <small>${item.timestamp}</small>
            </div>
            <small>Suara: ${item.inputs.suara}dB, Tekanan: ${item.inputs.tekanan}Bar, Putaran: ${item.inputs.putaran}RPM</small>
        `;

    historyItem.addEventListener("click", function () {
      loadFromHistory(item);

      // Highlight item yang dipilih
      document
        .querySelectorAll(".history-item")
        .forEach((el) => el.classList.remove("active"));
      this.classList.add("active");
    });

    historyList.appendChild(historyItem);
  });
}

// Muat data dari riwayat
function loadFromHistory(item) {
  // Isi form dengan nilai dari riwayat
  document.getElementById("suara_pompa").value = item.inputs.suara;
  document.getElementById("suara_value").textContent =
    item.inputs.suara + " dB";

  document.getElementById("tekanan_air").value = item.inputs.tekanan;
  document.getElementById("tekanan_value").textContent =
    item.inputs.tekanan + " Bar";

  document.getElementById("putaran_motor").value = item.inputs.putaran;
  document.getElementById("putaran_value").textContent =
    item.inputs.putaran + " RPM";

  if (item.inputs.kipas === 1) {
    document.getElementById("kipas_yes").checked = true;
  } else {
    document.getElementById("kipas_no").checked = true;
  }

  // Tampilkan hasil diagnosis
  displayDiagnosisResult(item);
}

// Tampilkan hasil diagnosis
function displayDiagnosisResult(data) {
  // Tampilkan bagian hasil
  document.getElementById("result-section").style.display = "block";

  // Perbarui gauge
  const gauge = document.getElementById("kerusakan-gauge");
  gauge.style.width = data.hasil + "%";
  document.getElementById("kerusakan-value").textContent = data.hasil + "%";

  if (data.hasil < 40) {
    gauge.className = "gauge-value ringan";
    document.getElementById("diagnosis-result").className =
      "alert alert-success";
  } else if (data.hasil < 60) {
    gauge.className = "gauge-value sedang";
    document.getElementById("diagnosis-result").className =
      "alert alert-warning";
  } else {
    gauge.className = "gauge-value berat";
    document.getElementById("diagnosis-result").className =
      "alert alert-danger";
  }

  document.getElementById("diagnosis-result").textContent =
    data.jenis_kerusakan;

  // Perbarui daftar komponen
  const componentsList = document.getElementById("komponen-list");
  componentsList.innerHTML = "";

  if (data.komponen_rusak.length === 0) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = "Tidak ada komponen yang bermasalah serius";
    componentsList.appendChild(li);
  } else {
    data.komponen_rusak.forEach((komponen) => {
      const li = document.createElement("li");
      li.className = "list-group-item";

      switch (komponen) {
        case "bearing":
          li.textContent = "Bearing - Perlu penggantian";
          document.querySelector(".bearing").classList.add("active");
          break;
        case "seal":
          li.textContent = "Seal Mechanic - Perlu penggantian";
          document.querySelector(".seal").classList.add("active");
          break;
        case "dinamo":
          li.textContent = "Dinamo - Perlu perbaikan atau penggantian";
          document.querySelector(".dinamo").classList.add("active");
          break;
        case "kipas":
          li.textContent = "Kipas Pendingin - Perlu penggantian";
          document.querySelector(".kipas").classList.add("active");
          break;
      }

      componentsList.appendChild(li);
    });
  }

  // Reset highlight komponen yang tidak dalam daftar
  components.forEach((component) => {
    const compName = component.getAttribute("data-component");
    if (!data.komponen_rusak.includes(compName)) {
      component.classList.remove("active");
    }
  });
}

// Form submission
document
  .getElementById("diagnosis-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("/diagnose", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert("Error: " + data.error);
          return;
        }

        // Tampilkan hasil diagnosis
        displayDiagnosisResult(data);

        // Simpan ke riwayat
        saveToHistory(data);
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat melakukan diagnosis");
      });
  });
