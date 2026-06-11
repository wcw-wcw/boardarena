import { expect, test, type Page } from "@playwright/test";

async function useLocalPlay(page: Page) {
  await page.getByRole("button", { name: "Local play" }).click();
  await expect(page.getByLabel("AI difficulty")).toHaveCount(0);
  await page.getByRole("button", { name: "Start match" }).click();
}

async function openGame(page: Page, gameName: "Connect 4" | "Tic-Tac-Toe" | "Reversi / Othello") {
  await page.getByRole("button", { name: gameName }).click();
}

test("loads the home setup and opens the catalog on demand", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pick a table, set the match, and play." })).toBeVisible();
  await expect(page.getByLabel("Match setup")).toBeVisible();
  await expect(page.getByLabel("Game mode")).toBeVisible();
  await expect(page.getByLabel("AI difficulty")).toBeVisible();
  await expect(page.getByTestId("arena-catalog")).toHaveCount(0);

  await page.getByRole("button", { name: "Change game" }).click();
  await expect(page.getByTestId("arena-catalog")).toBeVisible();
  await expect(page.getByTestId("game-card-connect4")).toBeVisible();
  await expect(page.getByTestId("game-card-tictactoe")).toBeVisible();
  await expect(page.getByTestId("game-card-reversi")).toBeVisible();
});

test("opens Connect 4 and accepts a basic move", async ({ page }) => {
  await page.goto("/");
  await useLocalPlay(page);

  await expect(page.getByTestId("board-connect4")).toBeVisible();
  await expect(page.getByTestId("arena-catalog")).toHaveCount(0);
  await page.getByTestId("connect4-drop-3").click();
  await expect(page.locator(".board-grid .disc.player-1")).toHaveCount(1);
});

test("opens Tic-Tac-Toe and accepts a basic move", async ({ page }) => {
  await page.goto("/");
  await openGame(page, "Tic-Tac-Toe");
  await useLocalPlay(page);

  await expect(page.getByTestId("board-tictactoe")).toBeVisible();
  await page.getByTestId("tictactoe-cell-1-1").click();
  await expect(page.getByTestId("tictactoe-cell-1-1")).toContainText("X");
});

test("opens Reversi and accepts a legal opening move", async ({ page }) => {
  await page.goto("/");
  await openGame(page, "Reversi / Othello");
  await useLocalPlay(page);

  await expect(page.getByTestId("board-reversi")).toBeVisible();
  await expect(page.locator(".reversi-cell.legal-cell")).toHaveCount(4);
  await page.getByTestId("reversi-cell-2-3").click();
  await expect(page.locator(".reversi-disc.player-1")).toHaveCount(4);
});

test("shows an understandable backend request failure state", async ({ page }) => {
  await page.route("**/games", (route) => route.abort("failed"));

  await page.goto("/");
  await page.getByRole("button", { name: "Start match" }).click();

  await expect(page.getByRole("alert")).toContainText("Action needed");
  await expect(page.getByText("Cannot reach the BoardArena API")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry connection" })).toBeVisible();
});
