import { expect, test, type Page } from "@playwright/test";

async function useLocalPlay(page: Page) {
  await page.getByRole("button", { name: "Local play" }).click();
  await page.getByRole("button", { name: "New match" }).click();
}

async function openGame(page: Page, gameId: "connect4" | "tictactoe" | "reversi") {
  if (gameId === "connect4") return;
  await page.getByTestId(`game-card-${gameId}`).getByRole("button").click();
}

test("loads the arena catalog and shared controls", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("arena-catalog")).toBeVisible();
  await expect(page.getByTestId("game-card-connect4")).toBeVisible();
  await expect(page.getByTestId("game-card-tictactoe")).toBeVisible();
  await expect(page.getByTestId("game-card-reversi")).toBeVisible();
  await expect(page.getByLabel("Game mode")).toBeVisible();
  await expect(page.getByLabel("AI difficulty")).toBeVisible();
  await expect(page.getByLabel("AI explanation")).toBeVisible();
});

test("opens Connect 4 and accepts a basic move", async ({ page }) => {
  await page.goto("/");
  await useLocalPlay(page);

  await expect(page.getByTestId("board-connect4")).toBeVisible();
  await page.getByTestId("connect4-drop-3").click();
  await expect(page.locator(".board-grid .disc.player-1")).toHaveCount(1);
});

test("opens Tic-Tac-Toe and accepts a basic move", async ({ page }) => {
  await page.goto("/");
  await useLocalPlay(page);
  await openGame(page, "tictactoe");

  await expect(page.getByTestId("board-tictactoe")).toBeVisible();
  await page.getByTestId("tictactoe-cell-1-1").click();
  await expect(page.getByTestId("tictactoe-cell-1-1")).toContainText("X");
});

test("opens Reversi and accepts a legal opening move", async ({ page }) => {
  await page.goto("/");
  await useLocalPlay(page);
  await openGame(page, "reversi");

  await expect(page.getByTestId("board-reversi")).toBeVisible();
  await expect(page.locator(".reversi-cell.legal-cell")).toHaveCount(4);
  await page.getByTestId("reversi-cell-2-3").click();
  await expect(page.locator(".reversi-disc.player-1")).toHaveCount(4);
});

test("shows an understandable backend request failure state", async ({ page }) => {
  await page.route("**/games", (route) => route.abort("failed"));

  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText("Action needed");
  await expect(page.getByText("The arena is waiting for the API.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry connection" })).toBeVisible();
});
