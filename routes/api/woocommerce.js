const fetch = require('node-fetch')


module.exports = (req, res) => {

    const getWCData = async () => {
        const { entity, date_min, date_max } = req.query
        const validEntities = ['rmb', 'skills-candid', 'skills-pro']

        if (validEntities.includes(entity) === false) return res.status(400).json({ error : 'Invalid entity' })
        if (date_min === undefined) return res.status(400).json({ error : 'date_min needed' })

        if (entity === 'skills-candid' || entity === 'skills-pro') {
            const productString = () => {
                if (entity === 'skills-candid') return '&product-id=50'
                if (entity === 'skills-pro') return '&product-id=41735'
                return ''
            }
            const domain = process.env.SKILLS_URL
            const key = `&key=${process.env.SKILLS_API_KEY}`
            const params = `?date-min=${date_min}&date-max=${date_max}${key}${productString()}`
            const url = `${domain}/wp-json/jw/report${params}}`
            const orderResponse = await fetch(url)
            const orderData = await orderResponse.json()
            console.log(url)
            console.log(orderData)
            res.send(orderData)
        }

        if (entity === 'rmb') {
            const domain = process.env.RMB_URL
            const key = `&consumer_key=${process.env.RMB_WC_KEY}&consumer_secret=${process.env.RMB_WC_SECRET}`
            const date_maxString = date_max ? `&before=${date_max}` : ''
            const params = `?after=${date_min}T00:00:00${date_maxString}T23:59:59${key}`
            const url = `${domain}/wp-json/wc/v3/orders${params}&per_page=100&status=completed`
            const orderResponse = await fetch(url)
            const orderData = await orderResponse.json()
            console.log(url)
            console.log(orderData)
            res.send(orderData)
        }
    }

    getWCData().catch((err) => console.log(err))
}
