import { expect, test } from "@playwright/test";

test.describe("Composer controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pi");
  });

  test("model selector and attachment controls are not shown", async ({
    page,
  }) => {
    await expect(page.getByTestId("model-selector")).toHaveCount(0);
    await expect(page.getByTestId("attachments-button")).toHaveCount(0);
  });
});
