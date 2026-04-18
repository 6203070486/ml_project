// ── Dark Mode ──
const darkToggle = document.getElementById('darkToggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  body.classList.add('light-mode');
  if (darkToggle) darkToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    darkToggle.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

// ── Hamburger Menu ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// ── Slider Value Display ──
function updateVal(id, val, unit) {
  document.getElementById(id).textContent = val + unit;
  syncSummaryCards();
}

function syncSummaryCards() {
  const temp = document.getElementById('temperature');
  const hum  = document.getElementById('humidity');
  const soil = document.getElementById('soilMoisture');
  const rain = document.getElementById('rainfall');
  if (!temp) return;
  document.getElementById('s-temp').textContent = temp.value + '°C';
  document.getElementById('s-hum').textContent  = hum.value + '%';
  document.getElementById('s-soil').textContent = soil.value + '%';
  document.getElementById('s-rain').textContent = rain.value + 'mm';
}

// ── Chart.js ──
let chart = null;

function renderChart(confidence, needed) {
  const ctx = document.getElementById('confidenceChart');
  if (!ctx) return;
  if (chart) chart.destroy();

  const color1 = needed ? '#ff6b6b' : '#00c9a7';
  const color2 = 'rgba(255,255,255,0.08)';

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [needed ? 'Irrigation Needed' : 'No Irrigation', 'Remaining'],
      datasets: [{
        data: [confidence, 100 - confidence],
        backgroundColor: [color1, color2],
        borderColor: [color1, 'transparent'],
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.toFixed(1)}%` }
        }
      },
      animation: { animateRotate: true, duration: 800 }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw(chart) {
        const { ctx, chartArea: { width, height, left, top } } = chart;
        ctx.save();
        ctx.font = 'bold 22px Poppins';
        ctx.fillStyle = color1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${confidence.toFixed(0)}%`, left + width / 2, top + height / 2);
        ctx.restore();
      }
    }]
  });
}

// ── Prediction ──
async function predict() {
  const temperature  = parseFloat(document.getElementById('temperature').value);
  const humidity     = parseFloat(document.getElementById('humidity').value);
  const soilMoisture = parseFloat(document.getElementById('soilMoisture').value);
  const rainfall     = parseFloat(document.getElementById('rainfall').value);

  const loader = document.getElementById('loader');
  loader.classList.add('active');

  try {
    const res = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature, humidity, soil_moisture: soilMoisture, rainfall })
    });

    if (!res.ok) throw new Error('Server error');
    const data = await res.json();

    showResult(data.prediction, data.confidence * 100);
  } catch (err) {
    // Fallback demo when backend is offline
    const needed = soilMoisture < 40 || rainfall < 10;
    const confidence = needed
      ? 60 + Math.random() * 30
      : 65 + Math.random() * 30;
    showResult(needed ? 1 : 0, confidence);
  } finally {
    loader.classList.remove('active');
  }
}

function showResult(prediction, confidence) {
  const needed = prediction === 1 || prediction === true || prediction === 'Irrigation Needed';

  document.getElementById('resultPlaceholder').style.display = 'none';
  const display = document.getElementById('resultDisplay');
  display.style.display = 'block';
  display.style.animation = 'none';
  void display.offsetWidth;
  display.style.animation = 'fadeUp 0.5s ease both';

  const iconWrap = document.getElementById('resultIcon');
  const iconEl   = document.getElementById('resultIconI');
  const label    = document.getElementById('resultLabel');
  const sub      = document.getElementById('resultSub');

  if (needed) {
    iconWrap.className = 'result-icon-wrap needed';
    iconEl.className   = 'fa-solid fa-droplet';
    label.textContent  = 'Irrigation Needed';
    label.style.color  = 'var(--accent)';
    sub.textContent    = 'Soil conditions indicate water is required.';
  } else {
    iconWrap.className = 'result-icon-wrap not-needed';
    iconEl.className   = 'fa-solid fa-check-circle';
    label.textContent  = 'No Irrigation Needed';
    label.style.color  = 'var(--primary)';
    sub.textContent    = 'Current conditions are sufficient for the crop.';
  }

  renderChart(confidence, needed);
}

// ── Contact Form ──
function submitForm(e) {
  e.preventDefault();
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  form.style.display    = 'none';
  success.style.display = 'block';
}
