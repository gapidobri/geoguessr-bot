import puppeteer from 'puppeteer'
import fs from 'fs'

const browser = await puppeteer.launch({
    headless: false
})

const page = await browser.newPage()
await page.goto('https://www.geoguessr.com/signin')

await page.waitForSelector('input[name=email]')
await page.type('input[name=email]', 'geoguesserbeans@gmail.com')

await page.waitForSelector('input[name=password]')
await page.type('input[name=password]', 'H"4s/#an)+"@G`>]s')

await page.waitForSelector('button[type=submit]')
await page.click('button[type=submit]')

await page.waitForSelector('button[class="button button--large button--primary"]')

const cookies = await page.cookies()
console.log(cookies);

fs.writeFileSync('./cookies.json', JSON.stringify(cookies))