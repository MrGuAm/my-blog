import { Buffer } from "node:buffer"
import { expect, test, type Page } from "@playwright/test"
import { createTinyWavBuffer } from "../helpers/audio-fixtures"

test.describe.configure({ mode: "serial" })

const tinySvgBuffer = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#ff9b6b"/></svg>`
)
const tinyWavBuffer = createTinyWavBuffer()
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

test("public visitor can refine results on the search page", async ({ page }) => {
  await page.goto("/search?q=React")

  await expect(page.getByRole("heading", { name: "搜索内容" })).toBeVisible()
  await expect(page).toHaveURL(/\/search\?q=React/)
  await expect(page.getByText("共找到")).toBeVisible()

  const categoryOptions = await page.locator('select[name="category"] option').evaluateAll((options) =>
    options.map((option) => ({
      value: (option as HTMLOptionElement).value,
      label: option.textContent?.trim() || "",
    }))
  )
  const categoryValue = categoryOptions.find((option) => option.value !== "")?.value
  if (!categoryValue) {
    throw new Error("Search category select did not expose any non-empty options")
  }

  await page.selectOption('select[name="category"]', categoryValue)
  await page.selectOption('select[name="sort"]', { value: "newest" })
  await page.getByRole("button", { name: "搜索" }).click()

  await expect(page).toHaveURL(new RegExp(`category=${encodeURIComponent(categoryValue)}`))
  await expect(page).toHaveURL(/sort=newest/)
  await expect(page.getByText("共找到")).toBeVisible()
  await expect(page.locator("article").first()).toBeVisible()
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
  await expect(page.getByRole("heading", { name: "素材库" })).toBeVisible()
  await expect(page.getByText("图片素材")).toBeVisible()
  const uploadedCard = page.locator("div").filter({ hasText: new RegExp(fileBase) }).first()
  await expect(uploadedCard).toBeVisible()

  const deleteResponse = await page.context().request.delete(
    `${localBaseUrl}/api/admin/media?id=${encodeURIComponent(uploadPayload.asset.id)}`
  )
  expect(deleteResponse.ok()).toBeTruthy()

  await page.reload()
  await expect(page.locator("div").filter({ hasText: new RegExp(fileBase) })).toHaveCount(0)
})

test("admin can upload and delete tracks in the music admin UI", async ({ page }) => {
  await loginAsAdmin(page)

  const uniqueName = `E2E歌手 - E2E歌曲-${Date.now()}.wav`
  await page.goto("/admin/media?tab=music")
  await expect(page.getByRole("heading", { name: "素材库" })).toBeVisible()
  await expect(page.getByText("在线曲库")).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles({
    name: uniqueName,
    mimeType: "audio/wav",
    buffer: tinyWavBuffer,
  })

  await expect(page.getByText("成功上传 1 首歌曲")).toBeVisible()
  const uploadedCard = page.locator("div").filter({ hasText: /E2E歌曲-/ }).first()
  await expect(uploadedCard).toBeVisible()

  page.once("dialog", async (dialog) => {
    await dialog.accept()
  })
  await page.getByRole("button", { name: /删除歌曲 E2E歌曲-/ }).click()
  await expect(page.getByText("歌曲已删除")).toBeVisible()
  await expect(page.locator("div").filter({ hasText: /E2E歌曲-/ })).toHaveCount(0)
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
  const usedCard = page.locator("div").filter({ hasText: new RegExp(usedBase) }).first()
  await expect(usedCard).toBeVisible()
  await expect(page.locator("div").filter({ hasText: new RegExp(unusedBase) })).toHaveCount(0)

  await expect(usedCard.getByRole("button", { name: new RegExp(`素材 ${usedBase}.*无法删除`) })).toBeDisabled()

  await page.goto("/admin/media?usage=unused")
  await expect(page).toHaveURL(/usage=unused/)
  const unusedCard = page.locator("div").filter({ hasText: new RegExp(unusedBase) }).first()
  await expect(unusedCard).toBeVisible()
  await expect(page.locator("div").filter({ hasText: new RegExp(usedBase) })).toHaveCount(0)
})
