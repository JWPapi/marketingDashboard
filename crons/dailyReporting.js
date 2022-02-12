require('dotenv').config();
const { DateTime } = require('luxon')
const whatsapp = require('../services/sendWhatsapp')
const fetch = require('node-fetch')

const getWoocommerceData = async (dateMin, entity) => {
    const response = await fetch(`https://dashboard.exalting.com/api/woocommerce/?entity=${entity}&date_min=${dateMin}&date_max=${dateMin}`)
    return response.json()
}

const getFBData = async (entity) => {
    const response = await fetch(`https://dashboard.exalting.com/api/facebook?entity=${entity}&date_preset=yesterday&accessToken=${process.env.FB_ACCESS_TOKEN}`)
    return response.json()
}

const getAdWordsData = async (entity) => {
    const response = await fetch(`https://dashboard.exalting.com/api/analytics/adwords?entity=${entity}`)
    return response.json()
}

const getExchangeRates = async () => {
    const response = await fetch('https://api.exchangeratesapi.io/latest?access_key=18f87b9238942ef774dc23c81b579637&base=USD')
    return response.json()
}

const makeApiCalls = async () => {
    const yesterdayISO = DateTime.utc().minus({ days : 1 }).toISODate()

    const apiCalls = [
        getWoocommerceData(yesterdayISO, 'skills-candid'),
        getFBData('skills-candid'),
        getExchangeRates(),
        getAdWordsData('skills-candid'),
        getWoocommerceData(yesterdayISO, 'skills-pro'),
        getFBData('skills-pro'),
        getAdWordsData('skills-pro')
    ]
    const cost = {
        afterRefunds : 0.012,
        fees         : 0.0335,
        VAT          : 0.0765
    }
    const variableCostPercentage = cost.afterRefunds + cost.fees + cost.VAT

    const [wcCandid, fbCandid, conversion, gAdsCandid, wcPro, fbPro, gAdsPro] = await Promise.all(apiCalls)



    const generateReport = (wcData, fbData, gAdsData, conversionRates, variableCostPercentage) => {

        const salesInUSD = wcData.map(order => order.total / conversionRates[order.currency])
        const revenueUSD = salesInUSD.reduce((acc, curr) => acc + curr, 0)
        const revenueGBP = revenueUSD * conversionRates.GBP
        const revenueMinusVarCostsGBP = revenueGBP * (1 - variableCostPercentage)



        return {
            spend  : parseFloat(fbData.spend) + parseFloat(gAdsData[1][1]),
            profit : revenueMinusVarCostsGBP - parseFloat(fbData.spend) - parseFloat(gAdsData[1][1])
        }
    }

    const skillsPro = generateReport(wcPro, fbPro, gAdsPro, conversion.rates, variableCostPercentage)
    const skillsCandid = generateReport(wcCandid, fbCandid, gAdsCandid, conversion.rates, variableCostPercentage)

    const numbers = ['4915140773278', '13105073057', '447768115948', '447970260430']
    const proMessage = `skills Pro profit yesterday: *£${Math.round(skillsPro.profit)}* at £${Math.round(skillsPro.spend)} spend`
    const candidMessage = `skills Candid profit yesterday: *£${Math.round(skillsCandid.profit)}* at £${Math.round(skillsCandid.spend)} spend`
    console.log(proMessage)
    console.log(candidMessage)
    whatsapp.sendWhatsapp(numbers, candidMessage)
    whatsapp.sendWhatsapp(numbers, proMessage)
}

 makeApiCalls().catch((e) => console.log(e))

