const SOURCES = {
  sports: {
    label: "Sports · IPTV-org",
    type: "m3u",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u"
  },
  football: {
    label: "Football/Soccer · IPTV-org",
    type: "m3u",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    filter: "football soccer futbol calcio"
  },
  motorsport: {
    label: "Motorsport · IPTV-org",
    type: "m3u",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    filter: "motor racing motorsport f1 auto"
  },
  combat: {
    label: "Combat/Fight · IPTV-org",
    type: "m3u",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    filter: "fight combat boxing mma wrestling ufc kickboxing"
  },
  outdoor: {
    label: "Outdoor/Extreme · IPTV-org",
    type: "m3u",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    filter: "outdoor extreme surf skate ski snow bike adventure"
  },
  official: {
    label: "Official Sports Links",
    type: "custom",
    channels: [
      {
        id: "red-bull-tv",
        name: "Red Bull TV",
        country: "International",
        group: "Official Link",
        category: "Extreme Sports",
        tags: "official link extreme sports motorsport adventure bike surf skate",
        logo: "",
        externalUrl: "https://www.redbull.com/int-en/live",
        source: "Official Sports Links"
      },
      {
        id: "olympics",
        name: "Olympics",
        country: "International",
        group: "Official Link",
        category: "Olympic Sports",
        tags: "official link olympics sports highlights live",
        logo: "",
        externalUrl: "https://olympics.com/en/live/",
        source: "Official Sports Links"
      },
      {
        id: "fifa-plus",
        name: "FIFA+",
        country: "International",
        group: "Official Link",
        category: "Football",
        tags: "official link football soccer fifa",
        logo: "",
        externalUrl: "https://www.plus.fifa.com/",
        source: "Official Sports Links"
      },
      {
        id: "uefa-tv",
        name: "UEFA.tv",
        country: "Europe",
        group: "Official Link",
        category: "Football",
        tags: "official link football soccer uefa",
        logo: "",
        externalUrl: "https://www.uefa.tv/",
        source: "Official Sports Links"
      },
      {
        id: "fiba-youtube",
        name: "FIBA Basketball",
        country: "International",
        group: "Official Link",
        category: "Basketball",
        tags: "official link basketball fiba",
        logo: "",
        externalUrl: "https://www.youtube.com/@FIBA",
        source: "Official Sports Links"
      },
      {
        id: "world-athletics",
        name: "World Athletics",
        country: "International",
        group: "Official Link",
        category: "Athletics",
        tags: "official link athletics track field",
        logo: "",
        externalUrl: "https://worldathletics.org/videos",
        source: "Official Sports Links"
      },
      {
        id: "sls-skateboarding",
        name: "SLS Skateboarding",
        country: "International",
        group: "Official Link",
        category: "Extreme Sports",
        tags: "official link skateboarding extreme sports",
        logo: "",
        externalUrl: "https://www.youtube.com/@sls",
        source: "Official Sports Links"
      },
      {
        id: "world-surf-league",
        name: "World Surf League",
        country: "International",
        group: "Official Link",
        category: "Surfing",
        tags: "official link surfing extreme sports",
        logo: "",
        externalUrl: "https://www.worldsurfleague.com/",
        source: "Official Sports Links"
      }
    ]
  }
};

const channelsGrid = document.getElementById("channelsGrid");
const statusText = document.getElementById("statusText");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const searchInput = document.getElementById("searchInput");
const sourceSelect = document.getElementById("sourceSelect");
const searchButton = document.getElementById("searchButton");
const videoPlayer = document.getElementById("videoPlayer");
const externalFrame = document.getElementById("externalFrame");
const screenFrame = document.querySelector(".screen-frame");
const screenLabel = document.getElementById("screenLabel");
const currentChannel = document.getElementById("currentChannel");
const currentMeta = document.getElementById("currentMeta");
const playerLogo = document.getElementById("playerLogo");
const playerFavoriteButton = document.getElementById("playerFavoriteButton");
const stopButton = document.getElementById("stopButton");
const themeToggle = document.getElementById("themeToggle");
const channelCount = document.getElementById("channelCount");
const favoriteCount = document.getElementById("favoriteCount");
const pills = Array.from(document.querySelectorAll(".pill"));

let channels = [];
let activeFilter = "";
let currentPlayingChannel = null;
let hlsInstance = null;

let favoriteChannels = JSON.parse(localStorage.getItem("openSportsTvFavorites") || "[]");
let recentlyWatchedChannels = JSON.parse(localStorage.getItem("openSportsTvRecent") || "[]");
let favorites = favoriteChannels.map(channel => channel.id);
let stadiumMode = localStorage.getItem("openSportsTvStadium") || "off";

function updateFavoriteCount() {
  favoriteCount.textContent = favorites.length;
}

async function loadChannels() {
  if (activeFilter === "__favorites") {
    renderFavoriteChannels();
    return;
  }

  if (activeFilter === "__recent") {
    renderRecentlyWatchedChannels();
    return;
  }

  const selectedSource = SOURCES[sourceSelect.value];

  if (!selectedSource) {
    statusText.textContent = "Unknown source. Refresh and try again.";
    channelsGrid.innerHTML = `<div class="empty-state">This source is not available.</div>`;
    return;
  }

  statusText.textContent = `Loading ${selectedSource.label}...`;
  activeFilterLabel.textContent = selectedSource.label;
  channelsGrid.innerHTML = "";
  channelCount.textContent = "0";

  try {
    const parsedChannels = selectedSource.type === "custom"
      ? selectedSource.channels
      : await loadM3USource(selectedSource);

    channels = applyFilters(parsedChannels, selectedSource.filter)
      .filter(channel => channel.url || channel.externalUrl)
      .filter(removeDuplicateStreams)
      .slice(0, 260);

    renderChannels(channels);

    channelCount.textContent = channels.length;
    statusText.textContent = channels.length
      ? `${channels.length} sports channels loaded`
      : "No channels found. Try another source or filter.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Could not load channels. The public playlist may be temporarily unavailable.";
    channelsGrid.innerHTML = `<div class="empty-state">Something went wrong while loading channels.</div>`;
  }
}

async function loadM3USource(source) {
  const response = await fetch(source.url);

  if (!response.ok) {
    throw new Error(`Source failed: ${source.label}`);
  }

  const text = await response.text();
  return parseM3U(text, source.label);
}

function applyFilters(inputChannels, sourceFilter = "") {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filterTerm = activeFilter.toLowerCase();
  const sourceFilterTerms = sourceFilter
    ? sourceFilter.toLowerCase().split(" ").filter(Boolean)
    : [];

  return inputChannels.filter(channel => {
    const haystack = [
      channel.name,
      channel.country,
      channel.group,
      channel.category,
      channel.tags
    ].join(" ").toLowerCase();

    const matchesSearch = !searchTerm || haystack.includes(searchTerm);
    const matchesFilter = !filterTerm || haystack.includes(filterTerm);
    const matchesSourceFilter = !sourceFilterTerms.length || sourceFilterTerms.some(term => haystack.includes(term));

    return matchesSearch && matchesFilter && matchesSourceFilter;
  });
}

function parseM3U(text, sourceLabel) {
  const lines = text.split(/\r?\n/);
  const parsed = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line.startsWith("#EXTINF")) {
      continue;
    }

    const url = findNextStreamUrl(lines, index + 1);

    if (!url) {
      continue;
    }

    const name = parseM3UName(line);
    const logo = parseAttribute(line, "tvg-logo");
    const country = parseAttribute(line, "tvg-country") || "International";
    const group = parseAttribute(line, "group-title") || "Sports";

    parsed.push({
      id: makeChannelId(name, url),
      name,
      country,
      group,
      category: group,
      tags: `${group} ${sourceLabel} sports`,
      logo,
      url,
      source: sourceLabel
    });
  }

  return parsed;
}

function findNextStreamUrl(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    return line;
  }

  return "";
}

function parseM3UName(line) {
  const commaIndex = line.lastIndexOf(",");
  return commaIndex === -1 ? "Unnamed channel" : line.slice(commaIndex + 1).trim() || "Unnamed channel";
}

function parseAttribute(line, attributeName) {
  const regex = new RegExp(`${attributeName}="([^"]*)"`);
  const match = line.match(regex);
  return match ? match[1] : "";
}

function removeDuplicateStreams(channel, index, array) {
  const currentKey = channel.externalUrl || channel.url;
  return array.findIndex(item => (item.externalUrl || item.url) === currentKey) === index;
}

function renderChannels(channelsToRender) {
  channelsGrid.innerHTML = "";

  if (!channelsToRender.length) {
    channelsGrid.innerHTML = `<div class="empty-state">No channels to show yet.</div>`;
    return;
  }

  channelsToRender.forEach(channel => {
    const card = document.createElement("article");
    card.className = `channel-card${channel.externalUrl ? " external" : ""}`;

    const initials = getInitials(channel.name);
    const isFavorite = favorites.includes(channel.id);
    const actionLabel = channel.externalUrl ? "Open" : "Watch";

    card.innerHTML = `
      <div class="channel-top">
        <div class="channel-logo-wrap">
          ${channel.logo ? `<img class="channel-logo" src="${escapeHTML(channel.logo)}" alt="" loading="lazy" />` : initials}
        </div>
        <div>
          <div class="channel-name">${escapeHTML(channel.name)}</div>
          <div class="channel-country">${escapeHTML(channel.country || "International")}</div>
        </div>
      </div>

      <div class="channel-tags">${escapeHTML(channel.group || channel.category || "Sports")}</div>

      <div class="channel-actions">
        <button type="button" class="watch-button">${actionLabel}</button>
        <button type="button" class="favorite-button ${isFavorite ? "active" : ""}" aria-label="Toggle favourite">★</button>
      </div>
    `;

    const logo = card.querySelector(".channel-logo");

    if (logo) {
      logo.addEventListener("error", () => {
        logo.parentElement.textContent = initials;
      });
    }

    card.querySelector(".watch-button").addEventListener("click", () => {
      playChannel(channel);
    });

    card.querySelector(".favorite-button").addEventListener("click", event => {
      toggleFavorite(channel.id);
      event.currentTarget.classList.toggle("active");
    });

    channelsGrid.appendChild(card);
  });
}

function playChannel(channel) {
  statusText.textContent = `${channel.name} loading...`;
  destroyHls();

  if (channel.externalUrl) {
    openExternalChannel(channel);
    return;
  }

  screenFrame.classList.remove("external-mode");
  externalFrame.removeAttribute("src");

  if (window.Hls && Hls.isSupported() && channel.url.includes(".m3u8")) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });

    hlsInstance.loadSource(channel.url);
    hlsInstance.attachMedia(videoPlayer);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      startPlayback(channel);
    });

    hlsInstance.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        statusText.textContent = "This channel could not be played in the browser. Try another one.";
        destroyHls();
      }
    });

    return;
  }

  videoPlayer.src = channel.url;
  startPlayback(channel);
}

function openExternalChannel(channel) {
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();

  screenFrame.classList.add("external-mode");
  externalFrame.src = channel.externalUrl;

  currentPlayingChannel = channel;
  updatePlayerChannel(channel);
  saveRecentlyWatched(channel);
  statusText.textContent = `Official link opened: ${channel.name}`;

  // Also open in a new tab because many official sports sites block iframing.
  window.open(channel.externalUrl, "_blank", "noopener,noreferrer");

  if (activeFilter === "__recent") {
    renderRecentlyWatchedChannels();
  }
}

function startPlayback(channel) {
  videoPlayer.play()
    .then(() => {
      currentPlayingChannel = channel;
      updatePlayerChannel(channel);
      saveRecentlyWatched(channel);
      statusText.textContent = `Now playing: ${channel.name}`;

      if (activeFilter === "__recent") {
        renderRecentlyWatchedChannels();
      }
    })
    .catch(error => {
      console.error(error);
      currentPlayingChannel = channel;
      updatePlayerChannel(channel);
      statusText.textContent = "Playback is ready. Press play in the video player if it did not start automatically.";
    });
}

function updatePlayerChannel(channel) {
  currentChannel.textContent = channel.name;
  currentMeta.textContent = `${channel.country || "International"}${channel.group ? " · " + channel.group : ""}`;
  screenLabel.textContent = channel.name;

  const initials = getInitials(channel.name);

  if (channel.logo) {
    playerLogo.innerHTML = `<img src="${escapeHTML(channel.logo)}" alt="" />`;
    const logoImage = playerLogo.querySelector("img");
    logoImage.addEventListener("error", () => {
      playerLogo.textContent = initials;
    });
  } else {
    playerLogo.textContent = initials;
  }

  playerFavoriteButton.disabled = false;
  stopButton.disabled = false;
  playerFavoriteButton.classList.toggle("active", favorites.includes(channel.id));
}

function stopCurrentChannel() {
  videoPlayer.pause();
  destroyHls();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();

  externalFrame.removeAttribute("src");
  screenFrame.classList.remove("external-mode");

  currentPlayingChannel = null;
  currentChannel.textContent = "Nothing playing";
  currentMeta.textContent = "Choose a channel to start watching";
  screenLabel.textContent = "SELECT CHANNEL";
  playerLogo.textContent = "ST";
  playerFavoriteButton.disabled = true;
  playerFavoriteButton.classList.remove("active");
  stopButton.disabled = true;
  statusText.textContent = "Playback stopped.";
}

function destroyHls() {
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
}

function saveRecentlyWatched(channel) {
  recentlyWatchedChannels = recentlyWatchedChannels.filter(item => item.id !== channel.id);
  recentlyWatchedChannels.unshift(channel);
  recentlyWatchedChannels = recentlyWatchedChannels.slice(0, 20);
  localStorage.setItem("openSportsTvRecent", JSON.stringify(recentlyWatchedChannels));
}

function toggleFavorite(channelId) {
  const channel = channels.find(item => item.id === channelId)
    || favoriteChannels.find(item => item.id === channelId)
    || recentlyWatchedChannels.find(item => item.id === channelId);

  if (favorites.includes(channelId)) {
    favorites = favorites.filter(id => id !== channelId);
    favoriteChannels = favoriteChannels.filter(item => item.id !== channelId);
  } else if (channel) {
    favorites.push(channelId);
    favoriteChannels.push(channel);
  }

  localStorage.setItem("openSportsTvFavorites", JSON.stringify(favoriteChannels));
  updateFavoriteCount();

  if (currentPlayingChannel && currentPlayingChannel.id === channelId) {
    playerFavoriteButton.classList.toggle("active", favorites.includes(channelId));
  }

  if (activeFilter === "__favorites") {
    renderFavoriteChannels();
  }
}

function renderFavoriteChannels() {
  const selectedSource = SOURCES[sourceSelect.value];
  statusText.textContent = favoriteChannels.length
    ? `${favoriteChannels.length} favourite channel${favoriteChannels.length === 1 ? "" : "s"} saved`
    : "No favourites yet. Save channels with the star button.";
  activeFilterLabel.textContent = `${selectedSource?.label || "Sports"} · Favorites`;
  channelCount.textContent = favoriteChannels.length;
  renderChannels(favoriteChannels);
}

function renderRecentlyWatchedChannels() {
  const selectedSource = SOURCES[sourceSelect.value];
  statusText.textContent = recentlyWatchedChannels.length
    ? `${recentlyWatchedChannels.length} recently watched channel${recentlyWatchedChannels.length === 1 ? "" : "s"}`
    : "No recently watched channels yet.";
  activeFilterLabel.textContent = `${selectedSource?.label || "Sports"} · Recently Watched`;
  channelCount.textContent = recentlyWatchedChannels.length;
  renderChannels(recentlyWatchedChannels);
}

function makeChannelId(name, url) {
  return `${name}-${url}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 140);
}

function getInitials(name) {
  return String(name || "ST")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyStadiumMode(mode) {
  const safeMode = mode === "on" ? "on" : "off";
  document.body.classList.toggle("stadium", safeMode === "on");
  themeToggle.textContent = safeMode === "on" ? "Day Mode" : "Stadium Mode";
  themeToggle.setAttribute("aria-pressed", safeMode === "on" ? "true" : "false");
  localStorage.setItem("openSportsTvStadium", safeMode);
  stadiumMode = safeMode;
}

function toggleStadiumMode() {
  applyStadiumMode(stadiumMode === "on" ? "off" : "on");
}

searchButton.addEventListener("click", loadChannels);

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    loadChannels();
  }
});

sourceSelect.addEventListener("change", loadChannels);

pills.forEach(pill => {
  pill.addEventListener("click", () => {
    pills.forEach(item => item.classList.remove("active"));
    pill.classList.add("active");
    activeFilter = pill.dataset.filter || "";
    loadChannels();
  });
});

playerFavoriteButton.addEventListener("click", () => {
  if (currentPlayingChannel) {
    toggleFavorite(currentPlayingChannel.id);
  }
});

stopButton.addEventListener("click", stopCurrentChannel);
themeToggle.addEventListener("click", toggleStadiumMode);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

applyStadiumMode(stadiumMode);
updateFavoriteCount();
loadChannels();
