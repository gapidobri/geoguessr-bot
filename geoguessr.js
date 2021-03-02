const puppeteer = require('puppeteer')
const fs = require('fs')
const { setInterval } = require('timers')
require('dotenv').config()

let browser, page

const login = async () => {

    // Login
    await page.goto('https://www.geoguessr.com/signin')

    await page.waitForSelector('input[name=email]')
    await page.type('input[name=email]', process.env.EMAIL)

    await page.waitForSelector('input[name=password]')
    await page.type('input[name=password]', process.env.PASSWORD)

    await page.waitForSelector('button[type=submit]')
    await page.click('button[type=submit]')

}

const init = async () => {
    console.log('Initializing browser')
    browser = await puppeteer.launch({
        headless: true
    })

    page = await browser.newPage()

    console.log('Setting cookies')
    const cookies = JSON.parse(fs.readFileSync('./cookies.json'))
    await page.setCookie(...cookies)
}

const newGame = async () => {

    console.log('Creating new battle royale game')

    // Battle royale
    await page.goto('https://www.geoguessr.com/battle-royale')

    await page.waitForSelector('button[type=button]')
    await page.click('button[type=button]')

    await page.waitForSelector('button[class="button button--medium button--dark-ghost"]')
    await page.click('button[class="button button--medium button--dark-ghost"]')

    await page.waitForSelector('input[name=copy-link]')
    const url = await page.$eval('input[name=copy-link]', el => el.value)
    console.log('Created new game:')
    console.log(url)
    return url

}

const start = async () => {

    const replay = await page.waitForSelector('button[class="button button--medium button--ghost"]', {
        timeout: 3000
    })

    if (replay) {
        page.click('button[class="button button--medium button--ghost"]')
    }

    await page.waitForSelector('button[class="button button--large button--primary"]')
    await page.click('button[class="button button--large button--primary"]')

}

const stop = async () => {
    await browser.close()
}

const playerList = async () => {
    const players = (await page.$$eval('li[class="user-grid__item"]', el => el.map(v => v.textContent)))
        .filter(name => isNaN(name))
    return players
}

module.exports = {
    battleRoyale: async () => {
        await init()
        return await newGame()
    },
    start,
    stop,
    playerList,
}
