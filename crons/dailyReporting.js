const fetch = require('node-fetch')
const { DateTime } = require('luxon')
const whatsapp = require('../services/sendWhatsapp')

const getWoocommerceData = async (dateMin, entity) => {
    const response = await fetch(`https://dashboard.exalting.com/api/woocommerce/?entity=${entity}&date_min=${dateMin}&date_max=${dateMin}`)
    return response.json()
}

const getFBData = async (preset, entity) => {
    const params = entity === 'skills' ? '?entity=skills&' : '?entity=skills-pro&'
    const response = await fetch(`https://dashboard.exalting.com/api/facebook${params}date_preset=${preset}`)
    return response.json()
}

const getAdWordsData = async () => {
    const response = await fetch('https://dashboard.exalting.com/api/analytics/adwords')
    return response.json()
}

const getExchangeRates = async () => {
    const response = await fetch('https://api.exchangeratesapi.io/latest?access_key=18f87b9238942ef774dc23c81b579637&base=USD')
    return response.json()
}

const makeApiCalls = async () => {
    const yesterdayISO = DateTime.utc().minus({ days : 1 }).toISODate()

    const apiCalls = [
        getWoocommerceData(yesterdayISO, 'skills'),
        getFBData('yesterday', 'skills'),
        getExchangeRates(),
        getAdWordsData(),
        getWoocommerceData(yesterdayISO, 'skills-pro'),
        getFBData('yesterday', 'skills-pro')
    ]
    const cost = {
        afterRefunds : 0.012,
        fees         : 0.0485,
        VAT          : 0.0765
    }

    const [wcData, fbCandid, conversion, adWords, wcSkillsPro, fbSkillsPro] = await Promise.all(apiCalls)

    //ToDo: add Adwords Spend0.87
    const skillsPro = {
        sales : wcSkillsPro.map((order) => order.total / conversion.rates[order.currency]).reduce((a, b) => a + b, 0) * conversion.rates.GBP,
        salesAfterVariableCost() {
            return this.sales - this.sales * ( cost.fees + cost.VAT + cost.afterRefunds )
        },
        spend : fbSkillsPro.spend,
        profit() {
            return this.salesAfterVariableCost() - parseFloat(this.spend)
        }
    }

    const {
        total_sales   : sales,
        total_refunds : totalRefunds
    } = wcData
    const discounts = wcData.totals[yesterdayISO].discount

    //Todo: Get Candid Skills the same way I’m getting Pro Skills
    const skillsCandid = {
        sales : ( sales - discounts + totalRefunds ) * conversion.rates.GBP,
        salesAfterVariableCost() {
            return this.sales - this.sales * ( cost.fees + cost.VAT + cost.afterRefunds )
        },
        spend : fbCandid.spend - skillsPro.spend,
        profit() {
            return this.salesAfterVariableCost() - this.spend - fbSkillsPro.spend - adWords[1][1] - skillsPro.profit()
        }
    }

    const numbers = ['4915140773278', '13105073057', '447768115948', '447970260430']
    const proMessage = `skills Pro profit yesterday: *£${Math.round(skillsPro.profit())}* at £${Math.round(skillsPro.spend)} spend`
    const candidMessage = `skills Candid profit yesterday: *£${Math.round(skillsCandid.profit())}* at £${Math.round(skillsCandid.spend)} spend`

    whatsapp.sendWhatsapp(numbers, candidMessage)
    whatsapp.sendWhatsapp(numbers, proMessage)

}

exports.start = () => {
    makeApiCalls().catch((e) => console.log(e));
};

