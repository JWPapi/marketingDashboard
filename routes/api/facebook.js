const bizSdk = require('facebook-nodejs-business-sdk')

const { AdAccount } = bizSdk
const api = bizSdk.FacebookAdsApi.init(process.env.RMB_FB_TOKEN)

// date_preset is a parameter
module.exports = (req, res, next) => {
    const { entity } = req.query

    const getAccountID = (entity) => {
        if (entity === 'skills-candid' || entity === 'skills-pro') return process.env.SKILLS_FB_ACC_ID
        if (entity === 'rmb') return process.env.RMB_FB_ACC_ID
        return false
    }
    const accountId = getAccountID(entity)

    // ToDo: Filter by Campaign Tags
    const AdAccInstance = new bizSdk.AdAccount(accountId)

    const fields = ['spend', 'action_values', 'campaign_name']
    const getParams = (entity) => {
        if (entity === 'rmb') {
            return {
                date_preset : req.query.date_preset,
                filtering   : [
                    {
                        field    : 'action_type',
                        operator : 'IN',
                        value    : ['offsite_conversion.fb_pixel_purchase']
                    }
                ]
            }
        }
        if (entity === 'skills-candid') {
            return {
                date_preset : req.query.date_preset,
                filtering   : [
                    {
                        field    : 'action_type',
                        operator : 'IN',
                        value    : ['offsite_conversion.fb_pixel_purchase']
                    },
                    {
                        field    : 'campaign.name',
                        operator : 'NOT_CONTAIN',
                        value    : 'pro'
                    }
                ]
            }
        }
        if (entity === 'skills-pro') {
            return {
                date_preset : req.query.date_preset,
                filtering   : [
                    {
                        field    : 'action_type',
                        operator : 'IN',
                        value    : ['offsite_conversion.fb_pixel_purchase']
                    },
                    {
                        field    : 'campaign.name',
                        operator : 'CONTAIN',
                        value    : 'pro'
                    }
                ]
            }
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
}
