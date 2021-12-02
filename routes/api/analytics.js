const express = require('express')
const { google } = require('googleapis')
const { DateTime } = require('luxon')
const fetch = require('node-fetch')

const googleRouter = express.Router()
const analytics = google.analytics('v3')
const {
    GA_CLIENT_MAIL,
    GA_KEY,
    SKILLS_GA_VIEW_ID
} = process.env
const jwtClient = new google.auth.JWT(GA_CLIENT_MAIL, null, GA_KEY, ['https://www.googleapis.com/auth/analytics.readonly'], null)

const today = DateTime.utc().toISODate()
const yesterday = DateTime.utc().minus({ days : 1 }).toISODate()
const startOfMonth = DateTime.utc().startOf('month').toISODate()
const startOfLastMonth = DateTime.utc().minus({ month : 1 }).startOf('month').toISODate()
const endOfLastMonth = DateTime.utc().minus({ month : 1 }).endOf('month').toISODate()

const auth = {
    auth : jwtClient,
    ids  : SKILLS_GA_VIEW_ID
}

googleRouter.get('/adwords', (req, res, next) => {
    const { entity } = req.query
    const validEntities = ['skills-pro']['skills-candid']

    if (validEntities.include(entity) === false) return res.status(400).json({ error : 'Invalid entity' })

    const timeframes = [today, yesterday, [startOfMonth, today], [startOfLastMonth, endOfLastMonth]]

    const filters = {
        'skills-pro' : 'ga:medium==cpc;ga:adwordsCampaignID==15387684914',
        'skills-candid' : 'ga:medium==cpc;ga:adwordsCampaignID==11880812814,ga:adwordsCampaignID==12649858961,ga:adwordsCampaignID==12227960355'
    }

    const calls = timeframes.map((e) => ( analytics.data.ga.get({
        ...auth,
        filters      : filters[entity],
        metrics      : 'ga:transactionRevenue, ga:adCost',
        'start-date' : ( typeof e === 'string' ? e : e[0] ),
        'end-date'   : ( typeof e === 'string' ? e : e[1] )
    }) ))

    const exchangeRateCall = () => fetch('https://api.exchangeratesapi.io/latest?access_key=18f87b9238942ef774dc23c81b579637&base=USD').then((e) => e.json())
    const gaApiCalls = Promise.all(calls)

    Promise.all([gaApiCalls, exchangeRateCall()]).then((values) => {
        const gaDataArr = values[0].map((e) => e.data.rows[0])
        const gbpValues = gaDataArr.map((e) => e.map((f) => f * values[1].rates.GBP))
        res.send(gbpValues)
    }).catch(next)
})



module.exports = googleRouter
