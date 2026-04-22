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
}

async function uploadMediaAsset(page: Page, fileBase: string) {
  const response = await page.context().request.post(`${localBaseUrl}/api/admin/media`, {
    multipart: {
      file: {
        name: `${fileBase}.svg`,
        mimeType: "image/svg+xml",
        buffer: tinySvgBuffer,
      },
    },
  })
  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function createMediaPost(page: Page, title: string, assetUrl: string) {
  const response = await page.context().request.post(`${localBaseUrl}/api/posts`, {
    data: {
      title,
      content: `<p><img src="${assetUrl}" alt="${title}" /></p>`,
      coverImage: assetUrl,
      category: "测试",
      tags: ["media", "e2e"],
      draft: false,
    },
  })
  expect(response.ok()).toBeTruthy()
  return response.json()
}

test("public visitor can search and filter articles on the homepage", async ({ page }) => {
  await page.goto("/home")

  await expect(page.getByRole("heading", { name: /最近更新/i })).toBeVisible()
  const searchInput = page.getByPlaceholder("搜索文章或标签...")
  await searchInput.fill("React")
  await expect(searchInput).toHaveValue("React")
  await expect(page.locator("main")).toContainText("最近更新")
})

test("admin can update site settings through an authenticated browser context", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto("/admin/settings")
  await expect(page.getByRole("heading", { name: "品牌与前台文案" })).toBeVisible()

  const brandName = "Playwright Brand"
  const aboutTitle = "Playwright 关于页"

  const saveResponse = await page.context().request.patch(`${localBaseUrl}/api/admin/settings`, {
    data: {
      brandName,
      authorName: "Playwright Author",
      aboutTitle,
    },
  })
  expect(saveResponse.ok()).toBeTruthy()

  const settingsResponse = await page.request.get(`${localBaseUrl}/api/site-settings`)
  expect(settingsResponse.ok()).toBeTruthy()

  const settingsPayload = await settingsResponse.json()
  expect(settingsPayload.settings.brandName).toBe(brandName)
  expect(settingsPayload.settings.aboutTitle).toBe(aboutTitle)
})

test("admin can see uploaded media and deletion results in the media library UI", async ({ page }) => {
  await loginAsAdmin(page)

  const fileBase = `e2e-proof-${Date.now()}`
  const uploadPayload = await uploadMediaAsset(page, fileBase)

  await page.goto("/admin/media")
  await expect(page.getByRole("heading", { name: "站内媒体素材" })).toBeVisible()
  await expect(page.getByText(new RegExp(fileBase))).toBeVisible()

  const deleteResponse = await page.context().request.delete(
    `${localBaseUrl}/api/admin/media?id=${encodeURIComponent(uploadPayload.asset.id)}`
  )
  expect(deleteResponse.ok()).toBeTruthy()

  await page.reload()
  await expect(page.getByText(new RegExp(fileBase))).toHaveCount(0)
})

test("admin can filter media by usage state and see protected deletion controls", async ({ page }) => {
  await loginAsAdmin(page)

  const token = Date.now()
  const usedBase = `e2e-used-${token}`
  const unusedBase = `e2e-unused-${token}`
  const usedUpload = await uploadMediaAsset(page, usedBase)
  await uploadMediaAsset(page, unusedBase)
  await createMediaPost(page, `素材引用测试-${token}`, usedUpload.asset.url)

  await page.goto("/admin/media?usage=used")
  await expect(page.getByRole("heading", { name: "站内媒体素材" })).toBeVisible()
  await expect(page).toHaveURL(/usage=used/)
  await expect(page.getByText(new RegExp(usedBase))).toBeVisible()
  await expect(page.getByText(new RegExp(unusedBase))).toHaveCount(0)

  const usedCard = page.locator("div").filter({ hasText: new RegExp(usedBase) }).first()
  await expect(usedCard.getByRole("button", { name: "使用中" })).toBeDisabled()

  await page.goto("/admin/media?usage=unused")
  await expect(page).toHaveURL(/usage=unused/)
  await expect(page.getByText(new RegExp(unusedBase))).toBeVisible()
  await expect(page.getByText(new RegExp(usedBase))).toHaveCount(0)
})
