const fetch = require('node-fetch')

module.exports = (req, res) => {
    const {
        RMB_URL, RMB_WC_KEY, RMB_WC_SECRET, SKILLS_CK, SKILLS_CS, SKILLS_URL
    } = process.env
    let url = RMB_URL
    let ck = RMB_WC_KEY
    let cs = RMB_WC_SECRET

    const {
        period, date_min, entity, date_max
    } = req.query
    if (entity === 'skills-candid' || entity === 'skills-pro') {
        url = SKILLS_URL
        ck = SKILLS_CK
        cs = SKILLS_CS
    }
    let params = period ? `period=${period}` : `date_min=${date_min}`

    if (date_max !== undefined) {
        params += `&date_max=${date_max}`
    }

    if (entity === 'skills-pro' || entity === 'skills-candid' && !(period !== undefined)) {
        params = `after=${date_min}T00:00:00`
        if (date_max !== undefined) params += `&before=${date_max}T23:59:59`
    }

    const auth = `&consumer_key=${ck}&consumer_secret=${cs}`

    const getWCData = async () => {
        if (entity === 'skills-pro' || entity === 'skills-candid') {
            const orderURL = entity === 'skills-pro'
            ?`${url}/wp-json/wc/v3/orders?${params}${auth}&product=41735&per_page=100&status=completed`
            :`${url}/wp-json/wc/v3/orders?${params}${auth}&product=50&per_page=100&status=completed`
            const orderResponse = await fetch(orderURL)
            const orderData = await orderResponse.json()

            const orderTotalAndCurrency = Array.isArray(orderData) ? orderData.map((order, index) => {
                if (order.line_items.length > 1) {
                    if (entity === 'skills-pro') {
                        const proItems = order.line_items.filter(item => item.product_id === 41735)
                        return  {total: proItems[0].subtotal, currency: order.currency}
                    }
                    if (entity === 'skills-candid') {
                        const candidItems = order.line_items.filter(item => item.product_id === 50)
                        return  {total: candidItems[0].subtotal, currency: order.currency}
                    }
                }
                return { total : (order.total), currency : order.currency }
            }) : []

            res.send(orderTotalAndCurrency)
        } else {
            const apiUrl = `${url}/wp-json/wc/v3/reports/sales?${params}${auth}`
            const response = await fetch(apiUrl)
            const data = await response.json()
            res.send(data[0])
        }
    }

    getWCData().catch((err) => console.log(err))
}
