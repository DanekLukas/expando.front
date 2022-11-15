import { expect, test } from '@playwright/test'

test('test', async ({ page }) => {
  await page.goto('http://localhost:8100/')
  await page.getByTestId('input').click()
  await page.getByTestId('input').fill('test')
  await page.getByTestId('button').click()
  expect(page.getByText(/text/i))
})
