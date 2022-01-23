const { DateTime } = require('luxon')
const { fillTikTokChart } = require('./socialMediaChart')

//Dates
const todayLA = DateTime.local().setZone('America/Los_Angeles').toISODate()
const yesterdayLA = DateTime.local().setZone('America/Los_Angeles').minus({ days : 1 }).toISODate()
const firstDayOfMonthLA = DateTime.local().setZone('America/Los_Angeles').startOf('month').toISODate()
const lastDayOfMonthLA = DateTime.local().setZone('America/Los_Angeles').endOf('month').toISODate()

const todayUK = DateTime.utc().toISODate()
const yesterdayUK = DateTime.utc().minus({ days : 1 }).toISODate()
const firstDayOfMonthUK = DateTime.utc().startOf('month').toISODate()
const firstDayLastMonthUK = DateTime.utc().minus({ months : 1 }).startOf('month').toISODate()

//Constants
const varCostSkills = {
    afterRefunds : 0.012,
    fees         : 0.0335,
    VAT          : 0.0765
}
const varCostTotal = 1 - varCostSkills.afterRefunds - varCostSkills.fees - varCostSkills.VAT

const col = {
    today      : 1,
    yesterday  : 2,
    this_month : 3,
    last_month : 4
}

const $ = (e) => document.getElementById(e)
const currFormat = (val, curr) => curr + Math.round(val).toLocaleString()
const extractNum = (e) => parseFloat(e.innerText.substring(1).replace(',', '').replace('.', ''))


const getFBData = async (preset, column, entity, curr) => {
    const response = await fetch(`/api/facebook?entity=${entity}&date_preset=${preset}`)
    const {
        action_values : saleValue,
        spend
    } = await response.json()
    $(`fbSales-${entity}`).cells[column].innerText = currFormat(saleValue ? saleValue[0].value : 0, curr)
    $(`fbExp-${entity}`).cells[column].innerText = currFormat(spend || 0, curr)
}

const getWCData = async (entity) => {
    const todayFetch = fetch(`/api/woocommerce/?entity=${entity}&date_min=${todayUK}&date_max=${todayUK}`)
    const yesterdayFetch = fetch(`/api/woocommerce/?entity=${entity}&date_min=${yesterdayUK}&date_max=${yesterdayUK}`)
    const thisMonthFetch = fetch(`/api/woocommerce/?entity=${entity}&date_min=${firstDayOfMonthUK}&date_max=${todayUK}`)
    const lastMonthFetch = fetch(`/api/woocommerce/?entity=${entity}&date_min=${firstDayLastMonthUK}&date_max=${firstDayOfMonthUK}`)

    const responses = await Promise.all([todayFetch, yesterdayFetch, thisMonthFetch, lastMonthFetch])
    const [today, yesterday, thisMonth, lastMonth] = await Promise.all(responses.map((e) => e.json()))

    const exchangeResponse = await fetch('https://api.exchangeratesapi.io/latest?access_key=18f87b9238942ef774dc23c81b579637&base=USD')
    const { rates } = await exchangeResponse.json()

    const generateTotals = (orderList, entity) => {
        const ordersInUSDArray = orderList.map((order) => order.total / rates[order.currency])
        const totalVolume = ordersInUSDArray.reduce((a, b) => a + b, 0)
        if (entity === 'rmb') {
            return totalVolume
        } else {
            return totalVolume * rates.GBP * varCostTotal
        }
    }
    const [totalToday, totalYesterday, totalThisMonth, totalLastMonth] = [today, yesterday, thisMonth, lastMonth].map((e) => generateTotals(e, entity))


    const currencySign = entity === 'rmb' ? '$' : '£'
    $(`wcSales-${entity}`).cells[1].innerText = `${currencySign}${Math.round(totalToday)}`
    $(`wcSales-${entity}`).cells[2].innerText = `${currencySign}${Math.round(totalYesterday)}`
    $(`wcSales-${entity}`).cells[3].innerText = `${currencySign}${Math.round(totalThisMonth)}`
    $(`wcSales-${entity}`).cells[4].innerText = `${currencySign}${Math.round(totalLastMonth)}`

}

const dataCalls = [
    getFBData('today', col.today, 'rmb', '$'),
    getFBData('yesterday', col.yesterday, 'rmb', '$'),
    getFBData('this_month', col.this_month, 'rmb', '$'),
    getFBData('last_month', col.last_month, 'rmb', '$'),
    fillTikTokChart(),
    getWCData('rmb')
].map((e) => e.catch((err) => console.log(err)))

const fillWithData = async () => {
    await Promise.allSettled(dataCalls)

    Array.from($('profitRow-rmb').cells).forEach((e, i) => {
        if (i !== 0) {
            const fbSpend = extractNum($('fbExp-rmb').cells[i])
            const wooCommerceSales = extractNum($('wcSales-rmb').cells[i])

            e.innerText = currFormat(wooCommerceSales - fbSpend , '$')
        }
    })
}

fillWithData().catch((err) => console.log(err))



const getGoogleDataSkills = async (entity) => {
    const validEntities = ['skills-pro', 'skills-candid']
    if (validEntities.includes(entity) === false) throw new Error('not a valid entity')

    const response = await fetch(`api/analytics/adwords?entity=${entity}`)
    const json = await response.json()

    json.forEach((e, i) => {
        $(`googleSales-${entity}`).cells[i + 1].innerText = `£${Math.round(e[0])}`
        $(`googleExp-${entity}`).cells[i + 1].innerText = `£${Math.round(e[1])}`
    })
}

const dataCallsSkills = [
    getFBData('today', col.today, 'skills-candid', '£'),
    getFBData('yesterday', col.yesterday, 'skills-candid', '£'),
    getFBData('this_month', col.this_month, 'skills-candid', '£'),
    getFBData('last_month', col.last_month, 'skills-candid', '£'),
    getWCData('skills-candid'),
    getGoogleDataSkills('skills-candid')
].map((e) => e.catch((err) => console.log(err)))
const fillSkillsData = async () => {
    await Promise.allSettled(dataCallsSkills)


    Array.from($('profitRow-skills-candid').cells).forEach((e, i) => {
        if (i !== 0) {
            e.innerText = currFormat(extractNum($('wcSales-skills-candid').cells[i]) - extractNum($('fbExp-skills-candid').cells[i]) - extractNum($('googleExp-skills-candid').cells[i]), '£')
        }
    })
}

fillSkillsData().catch((err) => console.log(err))

const dataCallsSkillsPro = [
    getFBData('today', col.today, 'skills-pro', '£'),
    getFBData('yesterday', col.yesterday, 'skills-pro', '£'),
    getFBData('this_month', col.this_month, 'skills-pro', '£'),
    getFBData('last_month', col.last_month, 'skills-pro', '£'),
    getWCData('skills-pro'),
    getGoogleDataSkills('skills-pro')
].map((e) => e.catch((err) => console.log(err)))

const fillSkillsProData = async () => {
    await Promise.allSettled(dataCallsSkillsPro)

    Array.from($('profitRow-skills-pro').cells).forEach((e, i) => {
        if (i !== 0) {
            e.innerText = currFormat(extractNum($('wcSales-skills-pro').cells[i]) - extractNum($('fbExp-skills-pro').cells[i]) - extractNum($('googleExp-skills-pro').cells[i]), '£')
        }
    })
}

fillSkillsProData().catch((err) => console.log(err))

