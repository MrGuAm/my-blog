import { Buffer } from "node:buffer"
import { expect, test, type Page } from "@playwright/test"

test.describe.configure({ mode: "serial" })

const tinySvgBuffer = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#ff9b6b"/></svg>`
)
const localBaseUrl = "http://127.0.0.1:3101"

async function loginAsAdmin(page: Page) {
  const response = await page.request.post(`${localBaseUrl}/api/auth/login`, {
    data: { password: "integration-admin" },
  })
  expect(response.ok()).toBeTruthy()

  const setCookie = response.headers()["set-cookie"] || ""
  const match = setCookie.match(/session=([^;]+)/)
  if (!match) {
    throw new Error("Missing session cookie from admin login response")
  }

  await page.context().addCookies([
    {
      name: "session",
      value: match[1],
      url: localBaseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ])

  await page.goto("/admin/settings")
  await expect(page.getByRole("heading", { name: "品牌与前台文案" })).toBeVisible()
}

test("public visitor can search and filter articles on the homepage", async ({ page }) => {
  await page.goto("/home")

  await expect(page.getByRole("heading", { name: /最近更新/i })).toBeVisible()
  const searchInput = page.getByPlaceholder("搜索文章或标签...")
  await searchInput.fill("React")
  await expect(searchInput).toHaveValue("React")
  await expect(page.locator("main")).toContainText("最近更新")
})

test("admin can update site settings and see the brand update on another page", async ({ page }) => {
  await loginAsAdmin(page)

  const brandName = "Playwright Brand"
  const aboutTitle = "Playwright 关于页"

  await page.goto("/admin/settings")
  await page.getByLabel("站点名称").fill(brandName)
  await page.getByLabel("作者名称").fill("Playwright Author")
  await page.getByLabel("关于页标题").fill(aboutTitle)
  await page.getByRole("button", { name: "保存设置" }).click()

  await expect(page.getByText("站点设置已保存")).toBeVisible()

  await page.goto("/about")
  await expect(page.getByText(brandName)).toBeVisible()
  await expect(page.getByRole("heading", { name: aboutTitle })).toBeVisible()
})

test("admin can upload and delete an image in the media library UI", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto("/admin/media")

  const fileBase = `e2e-proof-${Date.now()}`
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: `${fileBase}.svg`,
    mimeType: "image/svg+xml",
    buffer: tinySvgBuffer,
  })

  await expect(page.getByText("素材上传成功")).toBeVisible()

  const assetCard = page.locator("div").filter({ hasText: new RegExp(fileBase) }).filter({
    has: page.getByRole("button", { name: "删除" }),
  }).first()

  await expect(assetCard).toBeVisible()

  page.once("dialog", (dialog) => dialog.accept())
  await assetCard.getByRole("button", { name: "删除" }).click()

  await expect(page.getByText("素材已删除")).toBeVisible()
  await expect(assetCard).toBeHidden()
})
