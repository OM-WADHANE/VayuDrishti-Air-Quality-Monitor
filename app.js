/**
 * VayuDrishti — Air Quality Intelligence
 * app.js — Complete Application Logic
 *
 * Data: OpenWeather Air Pollution API
 * Step 1: GET city coordinates via /weather endpoint
 * Step 2: GET air_pollution data using lat/lon
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ═══════════════════════════════════════════════════════════════════ */

const CONFIG = {
  STORAGE_KEY:     'vayu_owm_key',
  WEATHER_API_URL: 'https://api.openweathermap.org/data/2.5/weather',
  AIRPOLL_API_URL: 'https://api.openweathermap.org/data/2.5/air_pollution',
};

/**
 * OpenWeather AQI levels (index 1–5)
 * Reference: https://openweathermap.org/api/air-pollution
 */
const AQI_LEVELS = {
  1: {
    label:       'Good',
    cls:         'good',
    badge:       'badge--good',
    color:       '#22d45e',
    colorCls:    'aqi-color--good',
    icon:        '💚',
    ringColor:   'rgba(34,212,94,0.25)',
    healthTitle: 'Air Quality is Good',
    healthMsg:   'The air quality is satisfactory and poses little or no risk to public health. Ideal conditions for outdoor activities — enjoy the fresh air.',
    tips: ['🚴 Go cycling or jogging', '🪟 Open windows for ventilation', '🌳 Spend time outdoors', '🧘 Outdoor yoga or meditation', '🏊 All sports are safe'],
    description: 'Excellent air quality. Air pollution poses little or no risk. Enjoy your day outside!',
  },
  2: {
    label:       'Fair',
    cls:         'fair',
    badge:       'badge--fair',
    color:       '#9aff6e',
    colorCls:    'aqi-color--fair',
    icon:        '💛',
    ringColor:   'rgba(154,255,110,0.22)',
    healthTitle: 'Air Quality is Fair',
    healthMsg:   'Air quality is acceptable. There may be a minor health concern for a very small number of individuals who are unusually sensitive to air pollution.',
    tips: ['😷 Sensitive individuals: be cautious', '🚶 Light outdoor activity is fine', '💧 Stay hydrated outdoors', '🌬️ Monitor if conditions worsen'],
    description: 'Air quality is acceptable. Most people can engage in normal outdoor activities.',
  },
  3: {
    label:       'Moderate',
    cls:         'moderate',
    badge:       'badge--moderate',
    color:       '#f5c842',
    colorCls:    'aqi-color--moderate',
    icon:        '🧡',
    ringColor:   'rgba(245,200,66,0.22)',
    healthTitle: 'Moderate Air Quality',
    healthMsg:   'Members of sensitive groups (elderly, children, people with respiratory or heart conditions) may experience health effects. General public is less likely to be affected.',
    tips: ['🏠 Sensitive groups: stay indoors', '😷 Wear N95 mask if going out', '⏱️ Limit prolonged outdoor exertion', '💊 Keep medication readily accessible', '🚫 Avoid busy roads and traffic'],
    description: 'Air quality is acceptable but may pose a moderate health concern for sensitive individuals.',
  },
  4: {
    label:       'Poor',
    cls:         'poor',
    badge:       'badge--poor',
    color:       '#ff7043',
    colorCls:    'aqi-color--poor',
    icon:        '❤️',
    ringColor:   'rgba(255,112,67,0.22)',
    healthTitle: 'Poor Air Quality — Take Precautions',
    healthMsg:   'Everyone may begin to experience health effects. Members of sensitive groups may experience more serious effects. Reduce outdoor exertion and avoid prolonged activities outside.',
    tips: ['🏠 Stay indoors as much as possible', '😷 N95/N99 mask mandatory outdoors', '🚗 Use AC in vehicles (recirculate)', '🚫 No intense outdoor exercise', '🌿 Use HEPA air purifier indoors', '💨 Seal windows and doors'],
    description: 'Health effects are possible for everyone. Limit time outdoors and use protective masks.',
  },
  5: {
    label:       'Very Poor',
    cls:         'vpoor',
    badge:       'badge--vpoor',
    color:       '#c62828',
    colorCls:    'aqi-color--vpoor',
    icon:        '☣️',
    ringColor:   'rgba(198,40,40,0.25)',
    healthTitle: '⚠️ Very Poor — Health Emergency',
    healthMsg:   'SERIOUS HEALTH ALERT: The entire population is likely to experience strong health effects. Avoid all outdoor exposure. Remain indoors, seal windows, run air purifiers. Seek medical attention if you experience breathing difficulty.',
    tips: ['🚨 Emergency conditions — stay inside', '🚫 Do NOT go outdoors unnecessarily', '😷 P100 respirator if must venture out', '🏥 Seek medical help for any symptoms', '💨 Run HEPA purifiers at max setting', '📱 Monitor official health advisories', '🚒 Consider evacuation if persistent'],
    description: 'Emergency air quality conditions. Severe health risk for the entire population.',
  },
};

/**
 * Pollutant configuration: display name, unit, max for bar, color, WHO guideline
 */
const POLLUTANTS_CONFIG = [
  { key: 'pm2_5', label: 'PM2.5',   unit: 'μg/m³', max: 250, color: '#a78bfa', who: 15,  fullName: 'Fine Particulate Matter' },
  { key: 'pm10',  label: 'PM10',    unit: 'μg/m³', max: 430, color: '#06f6e8', who: 45,  fullName: 'Coarse Particulate Matter' },
  { key: 'co',    label: 'CO',      unit: 'μg/m³', max: 15400,color:'#f06cfe', who: 4000,fullName: 'Carbon Monoxide' },
  { key: 'no2',   label: 'NO₂',    unit: 'μg/m³', max: 400,  color: '#fbbf24', who: 25,  fullName: 'Nitrogen Dioxide' },
  { key: 'o3',    label: 'O₃',     unit: 'μg/m³', max: 240,  color: '#34d399', who: 100, fullName: 'Ozone' },
  { key: 'so2',   label: 'SO₂',    unit: 'μg/m³', max: 500,  color: '#fb923c', who: 40,  fullName: 'Sulphur Dioxide' },
  { key: 'nh3',   label: 'NH₃',    unit: 'μg/m³', max: 200,  color: '#60a5fa', who: 200, fullName: 'Ammonia' },
];

/* ═══════════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════════ */

const state = {
  apiKey:        localStorage.getItem(CONFIG.STORAGE_KEY) || '',
  currentCity:   null,
  currentData:   null,
  isLoading:     false,
};

/* ═══════════════════════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const DOM = {
  // API Panel
  apiPanel:     $('js-apiPanel'),
  apiKeyInput:  $('js-apiKeyInput'),
  saveKeyBtn:   $('js-saveKey'),
  clearKeyBtn:  $('js-clearKey'),
  toggleKeyBtn: $('js-toggleKey'),

  // Search
  cityInput:    $('js-cityInput'),
  searchBtn:    $('js-searchBtn'),
  locateBtn:    $('js-locateBtn'),
  clearInput:   $('js-clearInput'),
  chips:        document.querySelectorAll('.chip'),

  // States
  loading:      $('js-loading'),
  loadingText:  $('js-loadingText'),
  errorCard:    $('js-error'),
  errorMsg:     $('js-errorMsg'),
  dismissError: $('js-dismissError'),
  welcome:      $('js-welcome'),
  dashboard:    $('js-dashboard'),

  // Hero
  heroCard:     $('js-heroCard'),
  cityName:     $('js-cityName'),
  cityMeta:     $('js-cityMeta'),
  lastUpdated:  $('js-lastUpdated'),
  aqiValue:     $('js-aqiValue'),
  aqiBadge:     $('js-aqiBadge'),
  aqiDescription: $('js-aqiDescription'),
  temp:         $('js-temp'),
  humidity:     $('js-humidity'),
  wind:         $('js-wind'),

  // Gauge
  needleGroup:  $('js-needleGroup'),
  gaugeVal:     $('js-gaugeVal'),
  dominantPoll: $('js-dominantPoll'),

  // Scale
  scaleCursor:  $('js-scaleCursor'),
  scaleLabel:   $('js-scaleLabel'),

  // Pollutants
  pollutantsGrid: $('js-pollutantsGrid'),

  // Health
  healthCard:   $('js-healthCard'),
  healthBadge:  $('js-healthBadge'),
  healthIcon:   $('js-healthIcon'),
  healthIconRing: $('js-healthIconRing'),
  healthTitle:  $('js-healthTitle'),
  healthMessage: $('js-healthMessage'),
  healthTips:   $('js-healthTips'),

  // Loader steps
  ls1: $('ls-1'), ls2: $('ls-2'), ls3: $('ls-3'),

  // Clock
  clock: $('js-clock'),
  date:  $('js-date'),
  year:  $('js-year'),
};

/* ═══════════════════════════════════════════════════════════════════
   CLOCK
   ═══════════════════════════════════════════════════════════════════ */

function updateClock() {
  const now = new Date();
  if (DOM.clock) {
    DOM.clock.textContent = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
  if (DOM.date) {
    DOM.date.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  if (DOM.year) {
    DOM.year.textContent = now.getFullYear();
  }
}
setInterval(updateClock, 1000);
updateClock();

/* ═══════════════════════════════════════════════════════════════════
   API KEY MANAGEMENT
   ═══════════════════════════════════════════════════════════════════ */

function initApiPanel() {
  if (state.apiKey) {
    DOM.apiPanel.classList.add('hidden');
    DOM.apiKeyInput.value = state.apiKey;
  }
}

function saveApiKey() {
  const val = DOM.apiKeyInput.value.trim();
  if (!val) {
    shakeElement(DOM.apiKeyInput);
    return;
  }
  state.apiKey = val;
  localStorage.setItem(CONFIG.STORAGE_KEY, val);
  DOM.apiPanel.classList.add('hidden');
  showInfo('API key saved successfully! Search any city to begin.');

  // Auto-load Delhi as demo
  setTimeout(() => triggerSearch('Delhi'), 500);
}

function clearApiKey() {
  state.apiKey = '';
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  DOM.apiKeyInput.value = '';
  DOM.apiPanel.classList.remove('hidden');
  hideAllStates();
  DOM.welcome.classList.remove('hidden');
  showInfo('API key cleared.');
}

function toggleKeyVisibility() {
  const input = DOM.apiKeyInput;
  if (input.type === 'password') {
    input.type = 'text';
    DOM.toggleKeyBtn.textContent = '🙈';
  } else {
    input.type = 'password';
    DOM.toggleKeyBtn.textContent = '👁';
  }
}

/* ═══════════════════════════════════════════════════════════════════
   STATE MANAGEMENT
   ═══════════════════════════════════════════════════════════════════ */

function hideAllStates() {
  DOM.loading.classList.remove('active');
  DOM.errorCard.classList.remove('active');
  DOM.welcome.classList.add('hidden');
  DOM.dashboard.classList.remove('active');
}

function showLoading(message = 'Fetching air quality data…') {
  hideAllStates();
  DOM.loadingText.textContent = message;
  DOM.loading.classList.add('active');
  resetLoaderSteps();
}

function showError(message) {
  DOM.loading.classList.remove('active');
  DOM.errorCard.classList.add('active');
  DOM.errorMsg.textContent = message;
}

function showDashboard() {
  DOM.loading.classList.remove('active');
  DOM.errorCard.classList.remove('active');
  DOM.welcome.classList.add('hidden');
  DOM.dashboard.classList.add('active');
}

function showInfo(msg) {
  // Lightweight toast (fallback: console)
  console.info('[VayuDrishti]', msg);
}

/* ── Loader Steps ───────── */
function resetLoaderSteps() {
  [DOM.ls1, DOM.ls2, DOM.ls3].forEach(el => {
    el.classList.remove('active', 'done');
  });
  DOM.ls1.classList.add('active');
}

function advanceStep(step) {
  if (step === 2) {
    DOM.ls1.classList.remove('active');
    DOM.ls1.classList.add('done');
    DOM.ls2.classList.add('active');
  } else if (step === 3) {
    DOM.ls2.classList.remove('active');
    DOM.ls2.classList.add('done');
    DOM.ls3.classList.add('active');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SEARCH & FETCH FLOW
   ═══════════════════════════════════════════════════════════════════ */

function triggerSearch(city) {
  if (!city) city = DOM.cityInput.value.trim();
  if (!city) {
    shakeElement(DOM.cityInput.parentElement);
    return;
  }
  if (!state.apiKey) {
    DOM.apiPanel.classList.remove('hidden');
    shakeElement(DOM.apiKeyInput);
    return;
  }

  // Highlight active chip
  DOM.chips.forEach(c => c.classList.toggle('active', c.dataset.city === city));

  fetchAirQuality(city);
}

async function fetchAirQuality(cityQuery) {
  state.isLoading = true;
  showLoading('Resolving city location…');

  try {
    // ── STEP 1: Get coordinates + weather ──
    const weatherUrl = `${CONFIG.WEATHER_API_URL}?q=${encodeURIComponent(cityQuery)}&appid=${state.apiKey}&units=metric`;
    const weatherRes = await fetch(weatherUrl);

    if (weatherRes.status === 401) throw new Error('Invalid API key. Please check your OpenWeather key.');
    if (weatherRes.status === 404) throw new Error(`City "${cityQuery}" not found. Try a different name.`);
    if (!weatherRes.ok)            throw new Error(`Server error (${weatherRes.status}). Please try again.`);

    const weatherData = await weatherRes.json();
    advanceStep(2);

    const { lat, lon } = weatherData.coord;
    const cityName    = weatherData.name;
    const countryCode = weatherData.sys?.country || '';
    const tempC       = weatherData.main?.temp;
    const humidity    = weatherData.main?.humidity;
    const windSpeed   = weatherData.wind?.speed;
    const timezone    = weatherData.timezone;

    // ── STEP 2: Get air pollution data ──
    DOM.loadingText.textContent = 'Analysing air quality…';
    const airUrl = `${CONFIG.AIRPOLL_API_URL}?lat=${lat}&lon=${lon}&appid=${state.apiKey}`;
    const airRes  = await fetch(airUrl);

    if (!airRes.ok) throw new Error(`Air pollution data unavailable (${airRes.status}).`);

    const airData = await airRes.json();
    advanceStep(3);

    // Store in state
    state.currentCity = cityName;
    state.currentData = { weatherData, airData, lat, lon, countryCode, tempC, humidity, windSpeed };

    // Short pause for UX feedback
    await sleep(600);

    // Render
    renderDashboard({ cityName, countryCode, lat, lon, tempC, humidity, windSpeed, airData });

  } catch (err) {
    console.error('[VayuDrishti] Fetch error:', err);
    showError(err.message || 'An unexpected error occurred. Please try again.');
  } finally {
    state.isLoading = false;
  }
}

async function locateUser() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }
  if (!state.apiKey) {
    DOM.apiPanel.classList.remove('hidden');
    shakeElement(DOM.apiKeyInput);
    return;
  }

  showLoading('Detecting your location…');
  DOM.chips.forEach(c => c.classList.remove('active'));

  try {
    const position = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    );

    const { latitude: lat, longitude: lon } = position.coords;
    advanceStep(2);
    DOM.loadingText.textContent = 'Fetching local air quality…';

    // Reverse geocode via weather API
    const weatherUrl = `${CONFIG.WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${state.apiKey}&units=metric`;
    const weatherRes  = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error('Could not resolve your location to a city.');
    const weatherData = await weatherRes.json();

    const cityName    = weatherData.name;
    const countryCode = weatherData.sys?.country || '';
    const tempC       = weatherData.main?.temp;
    const humidity    = weatherData.main?.humidity;
    const windSpeed   = weatherData.wind?.speed;

    DOM.cityInput.value = cityName;
    toggleClearBtn();

    advanceStep(3);
    DOM.loadingText.textContent = 'Analysing air quality…';

    const airUrl  = `${CONFIG.AIRPOLL_API_URL}?lat=${lat}&lon=${lon}&appid=${state.apiKey}`;
    const airRes  = await fetch(airUrl);
    if (!airRes.ok) throw new Error('Air pollution data unavailable for your location.');
    const airData = await airRes.json();

    await sleep(500);
    renderDashboard({ cityName, countryCode, lat, lon, tempC, humidity, windSpeed, airData });

  } catch (err) {
    if (err.code === 1) {
      showError('Location permission denied. Please allow location access or search manually.');
    } else {
      showError(err.message || 'Could not get your location. Please search manually.');
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   RENDER DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */

function renderDashboard({ cityName, countryCode, lat, lon, tempC, humidity, windSpeed, airData }) {
  const component = airData.list?.[0];
  if (!component) {
    showError('No air quality data available for this location.');
    return;
  }

  const aqiIndex    = component.main?.aqi;         // 1–5
  const pollutants  = component.components || {};
  const timestamp   = component.dt;
  const level       = AQI_LEVELS[aqiIndex] || AQI_LEVELS[3];

  // ── Hero ──────────────────────────────────────────────────────
  DOM.cityName.textContent    = cityName;
  DOM.cityMeta.textContent    = countryCode
    ? `${countryCode} · ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`
    : `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;

  const updatedTime = timestamp
    ? new Date(timestamp * 1000).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : 'Just now';
  DOM.lastUpdated.textContent = `Updated: ${updatedTime}`;

  // Convert AQI index to approximate US AQI value for display
  const displayAQI = aqiIndexToApproxAQI(aqiIndex, pollutants);

  // AQI Number with colour
  DOM.aqiValue.textContent = displayAQI;
  DOM.aqiValue.className   = `aqi-value ${level.colorCls}`;

  // Badge
  DOM.aqiBadge.textContent = level.label;
  DOM.aqiBadge.className   = `aqi-badge ${level.badge}`;

  // Description
  DOM.aqiDescription.textContent = level.description;
  DOM.aqiDescription.style.borderLeftColor = level.color;

  // Weather extras
  DOM.temp.textContent     = tempC     !== undefined ? `${Math.round(tempC)}°C`   : '—';
  DOM.humidity.textContent = humidity  !== undefined ? `${humidity}%`             : '—';
  DOM.wind.textContent     = windSpeed !== undefined ? `${windSpeed} m/s`         : '—';

  // ── Gauge ─────────────────────────────────────────────────────
  renderGauge(displayAQI, level.color);
  DOM.gaugeVal.textContent      = displayAQI;
  DOM.gaugeVal.style.fill       = level.color;
  DOM.dominantPoll.textContent  = getDominantPollutant(pollutants);

  // ── Scale indicator ───────────────────────────────────────────
  // OWM AQI 1–5 mapped to visual 0–500 scale
  const scalePercent = Math.min((displayAQI / 500) * 100, 100);
  DOM.scaleCursor.style.left    = `${scalePercent}%`;
  DOM.scaleLabel.textContent    = `${displayAQI} — ${level.label}`;

  // ── Pollutants grid ───────────────────────────────────────────
  renderPollutants(pollutants);

  // ── Health card ───────────────────────────────────────────────
  renderHealthCard(level);

  // ── Show dashboard ────────────────────────────────────────────
  showDashboard();
  DOM.dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Gauge rendering ─────────────────────────────────────────────── */
function renderGauge(aqiValue, color) {
  // Needle: 0 AQI → -90°, 500 AQI → +90°
  const clamped  = Math.min(Math.max(aqiValue, 0), 500);
  const fraction = clamped / 500;
  const degrees  = -90 + (fraction * 180);

  DOM.needleGroup.style.transform = `rotate(${degrees}deg)`;
}

/* ── Pollutants grid ─────────────────────────────────────────────── */
function renderPollutants(components) {
  DOM.pollutantsGrid.innerHTML = '';

  POLLUTANTS_CONFIG.forEach((p, i) => {
    const rawVal     = components[p.key];
    const hasData    = rawVal !== undefined && rawVal !== null;
    const displayVal = hasData ? formatPollutantValue(rawVal, p.key) : '—';
    const fillPct    = hasData ? Math.min((rawVal / p.max) * 100, 100) : 0;
    const whoExceed  = hasData && rawVal > p.who;

    const card = document.createElement('div');
    card.className = 'pollutant-card';
    card.style.setProperty('--poll-color', p.color);
    card.setAttribute('title', `${p.fullName}\nValue: ${displayVal} ${p.unit}\nWHO guideline: ${p.who} ${p.unit}`);

    card.innerHTML = `
      <div class="poll-header">
        <span class="poll-name">${p.label}</span>
        <span class="poll-status-dot" style="background:${p.color}"></span>
      </div>
      <div class="poll-value">${displayVal}</div>
      <div class="poll-unit">${p.unit}</div>
      <div class="poll-bar-track">
        <div class="poll-bar-fill" style="background:${p.color}; box-shadow: 0 0 8px ${p.color}40;" data-fill="${fillPct}"></div>
      </div>
      <div class="poll-percentage">${hasData ? fillPct.toFixed(0) + '% of scale' : 'No data'}</div>
    `;

    DOM.pollutantsGrid.appendChild(card);

    // Animate bar after append (requires reflow)
    requestAnimationFrame(() => {
      setTimeout(() => {
        const bar = card.querySelector('.poll-bar-fill');
        if (bar) bar.style.width = fillPct + '%';
      }, 100 + i * 80); // stagger
    });
  });
}

/* ── Health card ─────────────────────────────────────────────────── */
function renderHealthCard(level) {
  DOM.healthBadge.textContent  = level.label;
  DOM.healthIcon.textContent   = level.icon;
  DOM.healthTitle.textContent  = level.healthTitle;
  DOM.healthMessage.textContent = level.healthMsg;
  DOM.healthTitle.style.color  = level.color;

  DOM.healthIconRing.style.background = level.ringColor;
  DOM.healthIconRing.style.boxShadow  = `0 0 20px ${level.ringColor}`;

  // Tips
  DOM.healthTips.innerHTML = level.tips
    .map(tip => `<div class="health-tip">${tip}</div>`)
    .join('');
}

/* ═══════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Convert OWM AQI index (1–5) to approximate US AQI numeric value
 * Uses the dominant pollutant's actual concentration where possible
 */
function aqiIndexToApproxAQI(index, components) {
  // Attempt to compute from PM2.5 (most commonly dominant)
  const pm25 = components?.pm2_5;
  if (pm25 !== undefined) {
    return calcPM25AQI(pm25);
  }

  // Fallback: midpoint values for each band
  const midpoints = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 300 };
  return midpoints[index] || 75;
}

/**
 * Calculate US EPA AQI from PM2.5 concentration (μg/m³)
 * Using EPA breakpoints
 */
function calcPM25AQI(pm25) {
  const breakpoints = [
    { bpLow: 0,    bpHigh: 12,   aqiLow: 0,   aqiHigh: 50  },
    { bpLow: 12.1, bpHigh: 35.4, aqiLow: 51,  aqiHigh: 100 },
    { bpLow: 35.5, bpHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
    { bpLow: 55.5, bpHigh: 150.4,aqiLow: 151, aqiHigh: 200 },
    { bpLow: 150.5,bpHigh: 250.4,aqiLow: 201, aqiHigh: 300 },
    { bpLow: 250.5,bpHigh: 350.4,aqiLow: 301, aqiHigh: 400 },
    { bpLow: 350.5,bpHigh: 500,  aqiLow: 401, aqiHigh: 500 },
  ];

  const bp = breakpoints.find(b => pm25 <= b.bpHigh) || breakpoints[breakpoints.length - 1];
  const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.bpHigh - bp.bpLow)) * (pm25 - bp.bpLow) + bp.aqiLow;
  return Math.round(aqi);
}

/**
 * Find the dominant pollutant (highest relative to its WHO guideline)
 */
function getDominantPollutant(components) {
  let maxRatio = 0;
  let dominant = 'PM2.5';

  POLLUTANTS_CONFIG.forEach(p => {
    const val = components[p.key];
    if (val !== undefined) {
      const ratio = val / p.who;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        dominant = p.label;
      }
    }
  });

  return dominant;
}

/**
 * Format a pollutant value sensibly
 */
function formatPollutantValue(value, key) {
  if (value === undefined || value === null) return '—';
  if (key === 'co') return (value / 1000).toFixed(2) + 'k'; // CO in μg/m³ → display in thousands
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10)  return value.toFixed(1);
  return value.toFixed(2);
}

/** Shake animation for invalid inputs */
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', () => el.style.animation = '', { once: true });

  if (!document.querySelector('#shakeKeyframe')) {
    const style = document.createElement('style');
    style.id    = 'shakeKeyframe';
    style.textContent = `
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-8px); }
        40%      { transform: translateX(8px); }
        60%      { transform: translateX(-5px); }
        80%      { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }
}

/** Small sleep utility */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ═══════════════════════════════════════════════════════════════════
   SEARCH INPUT CLEAR BUTTON
   ═══════════════════════════════════════════════════════════════════ */

function toggleClearBtn() {
  DOM.clearInput.classList.toggle('visible', DOM.cityInput.value.trim().length > 0);
}

/* ═══════════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════ */

// API key
DOM.saveKeyBtn.addEventListener('click', saveApiKey);
DOM.clearKeyBtn.addEventListener('click', clearApiKey);
DOM.toggleKeyBtn.addEventListener('click', toggleKeyVisibility);
DOM.apiKeyInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveApiKey();
});

// Search
DOM.searchBtn.addEventListener('click', () => triggerSearch(DOM.cityInput.value.trim()));
DOM.cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') triggerSearch(DOM.cityInput.value.trim());
});
DOM.cityInput.addEventListener('input', toggleClearBtn);
DOM.clearInput.addEventListener('click', () => {
  DOM.cityInput.value = '';
  toggleClearBtn();
  DOM.chips.forEach(c => c.classList.remove('active'));
  DOM.cityInput.focus();
});

// Locate
DOM.locateBtn.addEventListener('click', locateUser);

// City chips
DOM.chips.forEach(chip => {
  chip.addEventListener('click', () => {
    const city = chip.dataset.city;
    DOM.cityInput.value = city;
    toggleClearBtn();
    triggerSearch(city);
  });
});

// Dismiss error
DOM.dismissError.addEventListener('click', () => {
  DOM.errorCard.classList.remove('active');
  if (!state.currentData) {
    DOM.welcome.classList.remove('hidden');
  }
});

/* ═══════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════ */

function init() {
  // Show API panel if no key saved
  initApiPanel();

  // Auto-load a default city if key is present
  if (state.apiKey) {
    setTimeout(() => triggerSearch('Delhi'), 400);
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
