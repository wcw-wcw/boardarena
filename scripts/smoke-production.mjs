#!/usr/bin/env node

const REQUIRED_ENV = ["PUBLIC_FRONTEND_URL", "PUBLIC_API_BASE_URL"];

function normalizeUrl(value, name) {
  try {
    return new URL(value.trim().replace(/\/+$/, ""));
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

function apiUrl(apiBaseUrl, path) {
  const base = apiBaseUrl.href.replace(/\/+$/, "");
  return new URL(`${base}${path}`);
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  console.error(`FAIL ${message}`);
}

function info(message) {
  console.log(`INFO ${message}`);
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${url} returned non-JSON response: ${text.slice(0, 120)}`);
  }
  return { response, body };
}

async function checkHealth(apiBaseUrl, path) {
  const { response, body } = await fetchJson(apiUrl(apiBaseUrl, path));
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  if (body?.status !== "ok") {
    throw new Error(`${path} did not return status "ok"`);
  }
  pass(`backend ${path} returned status ok`);
}

async function checkFrontend(frontendUrl) {
  const response = await fetch(frontendUrl);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    throw new Error(`frontend returned HTTP ${response.status}`);
  }
  if (!contentType.includes("text/html") && !text.toLowerCase().includes("<!doctype html")) {
    throw new Error("frontend did not look like an HTML page");
  }
  pass("frontend returned an HTML page");
}

async function createGame(apiBaseUrl, gameType) {
  const { response, body } = await fetchJson(apiUrl(apiBaseUrl, "/games"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game_type: gameType,
      mode: "pvp",
      starting_player: 1,
      ai_strategy_p1: "medium",
      ai_strategy_p2: "medium",
    }),
  });

  if (response.status !== 201) {
    throw new Error(`creating ${gameType} returned HTTP ${response.status}`);
  }
  if (!body?.game_id || body.game_type !== gameType || body.status !== "in_progress") {
    throw new Error(`creating ${gameType} returned an unexpected payload`);
  }
  pass(`${gameType} game creation worked`);
  return body;
}

async function makeMove(apiBaseUrl, game, move) {
  const { response, body } = await fetchJson(apiUrl(apiBaseUrl, `/games/${game.game_id}/moves/human`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(move),
  });

  if (!response.ok) {
    throw new Error(`${game.game_type} move returned HTTP ${response.status}`);
  }
  if (body?.state?.history?.length !== 1) {
    throw new Error(`${game.game_type} move did not update history`);
  }
  pass(`${game.game_type} accepted a valid human move`);
}

async function checkCors(apiBaseUrl, frontendUrl) {
  const origin = frontendUrl.origin;
  const response = await fetch(apiUrl(apiBaseUrl, "/games"), {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  const allowedOrigin = response.headers.get("access-control-allow-origin");
  if (!response.ok) {
    throw new Error(`CORS preflight returned HTTP ${response.status}`);
  }
  if (allowedOrigin !== origin) {
    throw new Error(`CORS allowed origin was ${allowedOrigin || "(missing)"}, expected ${origin}`);
  }
  pass(`CORS preflight allowed ${origin}`);
}

async function main() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    fail(`missing required environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
    info("usage: PUBLIC_FRONTEND_URL=https://your-frontend.example.com PUBLIC_API_BASE_URL=https://your-api.example.com npm run smoke:production");
    process.exit(1);
  }

  const frontendUrl = normalizeUrl(process.env.PUBLIC_FRONTEND_URL, "PUBLIC_FRONTEND_URL");
  const apiBaseUrl = normalizeUrl(process.env.PUBLIC_API_BASE_URL, "PUBLIC_API_BASE_URL");

  info(`checking frontend ${frontendUrl.href}`);
  info(`checking API ${apiBaseUrl.href}`);

  await checkHealth(apiBaseUrl, "/health");
  await checkHealth(apiBaseUrl, "/api/health");
  await checkFrontend(frontendUrl);
  await checkCors(apiBaseUrl, frontendUrl);

  const connect4 = await createGame(apiBaseUrl, "connect4");
  await makeMove(apiBaseUrl, connect4, { column: 3 });

  const tictactoe = await createGame(apiBaseUrl, "tictactoe");
  await makeMove(apiBaseUrl, tictactoe, { row: 1, column: 1 });

  const reversi = await createGame(apiBaseUrl, "reversi");
  await makeMove(apiBaseUrl, reversi, { row: 2, column: 3 });

  pass("production smoke checks completed");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
