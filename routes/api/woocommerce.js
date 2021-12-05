const fetch = require('node-fetch')

module.exports = (req, res) => {
    const {
        entity,
        date_min,
        date_max
    } = req.query
    const validEntities = ['rmb', 'skills-candid', 'skills-pro']

    if (validEntities.includes(entity) === false) return res.status(400).json({ error : 'Invalid entity' })
    if (date_min === undefined) return res.status(400).json({ error : 'date_min needed' })

    const getAccessData = (entity) => {
        if (entity === 'skills-candid' || entity === 'skills-pro') {
            return {
                url    : process.env.SKILLS_URL,
                key    : process.env.SKILLS_CK,
                secret : process.env.SKILLS_CS
            }
        }
        if (entity === 'rmb') {
            return {
                url    : process.env.RMB_URL,
                key    : process.env.RMB_WC_KEY,
                secret : process.env.RMB_WC_SECRET
            }
        }
    }

    const getProductString = (entity) => {
        if (entity === 'skills-candid') return '&product=50'
        if (entity === 'skills-pro') return '&product=41735'
        if (entity === 'rmb') return ''
    }

    const generateParams = (date_min, date_max, entity) => {
        const accessData = getAccessData(entity)
        const auth = `&consumer_key=${accessData.key}&consumer_secret=${accessData.secret}`

        const productString = getProductString(entity)
        const date_maxString = date_max ? `&before=${date_max}` : ''

        return `?after=${date_min}T00:00:00${date_maxString}T23:59:59${auth}${productString}`

    }


    const getWCData = async (entity,date_min,date_max) => {
        const accessData = getAccessData(entity)
        const params = generateParams(date_min, date_max, entity)

        const orderURL = `${accessData.url}/wp-json/wc/v3/orders${params}&per_page=100&status=completed`
        const orderResponse = await fetch(orderURL)
        const orderData = await orderResponse.json()

        const orderTotalAndCurrency = Array.isArray(orderData) ? orderData.map((order) => {
            if (order.line_items.length > 1) {
                if (entity === 'skills-pro' || entity === 'skills-candid') {
                    const itemId = entity === 'skills-pro' ? 41735 : 50
                    const filteredItems = order.line_items.filter(item => item.product_id === itemId)
                    return {
                        total    : filteredItems[0].subtotal,
                        currency : order.currency
                    }
                }
            }

            return {
                total    : order.total,
                currency : order.currency
            }
        }) : []

        res.send(orderTotalAndCurrency)

    }

    getWCData(entity,date_min,date_max).catch((err) => console.log(err))
}
