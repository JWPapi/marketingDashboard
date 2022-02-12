const adsSdk = require('facebook-nodejs-business-sdk')
const express = require('express')
const facebookApiRouter = express.Router()

// date_preset is a parameter
facebookApiRouter.get('/', (req, res, next) => {
    const {
        entity,
        accessToken,
        date_preset
    } = req.query

    const getAccountID = (entity) => {
        if (entity === 'skills-candid' || entity === 'skills-pro') return process.env.SKILLS_FB_ACC_ID
        if (entity === 'rmb') return process.env.RMB_FB_ACC_ID
        if (entity === 'medipharma') return process.env.MEDIPHARMA_FB_ACC_ID
        return false
    }
    const accountId = getAccountID(entity)

    // ToDo: Needs to take Access Token from Database
    const api = adsSdk.FacebookAdsApi.init(accessToken || process.env.FB_ACCESS_TOKEN)
    const AdAccInstance = new adsSdk.AdAccount(accountId)

    const fields = ['spend', 'action_values', 'campaign_name']
    const filtering = [
        {
            field    : 'action_type',
            operator : 'IN',
            value    : ['offsite_conversion.fb_pixel_purchase']
        }
    ]

    const skillsCandidFilter = filtering.concat([
        {
            field    : 'campaign.name',
            operator : 'NOT_CONTAIN',
            value    : 'pro'
        }
    ])
    const skillsProFilter = filtering.concat([
        {
            field    : 'campaign.name',
            operator : 'CONTAIN',
            value    : 'pro'
        }
    ])

    const getParams = (entity) => {
        if (entity === 'skills-candid') {
            return {
                date_preset,
                filtering : skillsCandidFilter
            }
        }
        if (entity === 'skills-pro') {
            return {
                date_preset,
                filtering : skillsProFilter
            }
        }
        return {
            date_preset,
            filtering
        }
    }
    const params = getParams(entity)

    const getFbData = async () => {
        const accountProm = AdAccInstance.getInsights(fields, params)
        const [account] = await Promise.all([accountProm].map((e) => e.catch((e) => console.log(e))))

        const responseData = {
            action_values : account[0] !== undefined ? account[0]._data.action_values : [
                {
                    'action_type' : 'offsite_conversion.fb_pixel_purchase',
                    'value'       : '0'
                }
            ],
            spend         : account[0] !== undefined ? account[0]._data.spend : '0'
        }

        res.json(responseData)
    }

    getFbData().catch((e) => next(e))
})

//weekly Reporting Code
/*
facebookApiRouter.get('/weeklyReporting', (req, res, next) => {

    const {
        entity,
        accessToken
    } = req.query

    //ToDo: Delete unnecessary ids
    const getAccountID = (entity) => {
        if (entity === 'medipharma') return process.env.MEDIPHARMA_FB_ACC_ID
        if (entity === 'skills-candid' || entity === 'skills-pro') return process.env.SKILLS_FB_ACC_ID
        if (entity === 'rmb') return process.env.RMB_FB_ACC_ID
        return false
    }
    const accountId = getAccountID(entity)

    // ToDo: Needs to take Access Token from Database

    const api = adsSdk.FacebookAdsApi.init(accessToken || process.env.FB_ACCESS_TOKEN)
    api.setDebug(true)

    const account = new adsSdk.AdAccount(accountId)

    const filtering = [
        {
            field    : 'action_type',
            operator : 'IN',
            value    : ['omni_purchase']
        },
        {
            field    : 'impressions',
            operator : 'GREATER_THAN',
            value    : 0
        }
    ]
    const fields = ['campaign_id', 'spend', 'adset_name', 'adset_id', 'ad_name', 'impressions', 'clicks', 'actions', 'action_values']
    const params = {
        date_preset : 'last_7d',
        filtering
    }

    const FBSerializer = {
        data(array) {
            return array.filter(e => e[0] !== undefined).map((e) => e[0]._data)
        }
    }

    const FBFactory = {
        account: {
            async getCampaigns(accountInstance) {
                    return account.getCampaigns(['id']).then(campaigns => campaigns.map(campaign => new adsSdk.Campaign(campaign._data.id)))
            }
        },
        adSets: {

        },
        adSet: {

        },
        campaigns : {
            async getAdSets(campaigns) {
                return Promise.all(campaigns.map(this.campaign.getAdSets)).then(adSets => adSets.flat())
            }
        },
        campaign: {
            async getAdSets(campaign) {
                return campaign.getAdSets(['id']).then(adSets => adSets.map(adSet => new adsSdk.AdSet(adSet._data.id)))
            },
            async active(campaignInsights) {
                return campaignInsights.map(insightObj => new adsSdk.Campaign(insightObj[0]._data.campaign_id))
            }
        },

        async getInsights(sdkInstance) {
            // If the insights is longer than 1 it actually containts data
            return Promise.all(sdkInstance.map(fbInstance => fbInstance.getInsights(fields, params))).then(insights => insights.filter(insight => insight.length > 0))
        },

        async getAds(fbInstance) {
            return fbInstance.getAds(['id']).then(ads => ads.map(ad => new adsSdk.Ad(ad._data.id)))
        },

        async campaignsGetAdSets(campaigns) {
            return Promise.all(campaigns.map(campaign => this.getAdSets(campaign))).then(adSets => adsets.flat())
        },

    }

    const getFbData = async () => {
        const campaigns = {
            instances: await FBFactory.account.getCampaigns(account),
            insights: await FBFactory.getInsights(this.instances),
        }
        const activeCampaigns = await FBFactory.campaigns.active(campaigns.insights)
        const adSets = {
            instances: await FBFactory.campaigns.getAdSets(activeCampaigns),
            insights: await FBFactory.getInsights(this.instances),
        }




        res.json('ok')
        const adSetInsights = await FBFactory.getInsights(adSets)
        const adSetsData = FBSerializer.data(adSetInsights)

        const ads = await FBFactory.getAds(account)
        const adsInsights = await FBFactory.getInsights(ads)
        const adsData = FBSerializer.data(adsInsights)

        res.json([adSetsData,adsData])
    }


    getFbData().catch((e) => next(e))
})
*/

module.exports = facebookApiRouter
