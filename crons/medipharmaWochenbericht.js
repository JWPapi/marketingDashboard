const PDFDocument = require('pdfkit-table')
const doc = new PDFDocument({
    size   : 'A4',
    layout : 'portrait',
    margin : 20
})
const fs = require('fs')
const fetch = require('node-fetch')

const generatePDF = async () => {
    //ToDo: Name with Kalenderwoche
    doc.pipe(fs.createWriteStream('../pdfs/medipharma/testPdf2.pdf', {
        flags : 'w'
    }))

    doc.image('../public/img/deinMarkeding/logo.png', 475, 20, {
        width : 100
    })

    doc.text('Medipharma Wochenbericht', 0, 100, {
        align     : 'center',
        underline : true
    })
    doc.text('').moveDown(2)

    const fbData = await fetch('http://localhost:3000/api/facebook/weeklyReporting?entity=rmb').then(e => e.json())
    console.log(fbData)

    const adSets = fbData[0]
    const ads = fbData[1]

    // Konvertierungen ist ein bisschen geföhrlich, weil es darauf vertraut, dass nur ein Wert unter action_types ist
    const tableSerializer = (e) => [
        e.ad_name || e.adset_name,
        `${e.spend} €`,
        e.impressions,
        e.clicks,
        (e.actions ? e.actions[0].value : '-'),
        (e.action_values ? e.action_values[0].value / e.spend : '-')
    ]
    const serializedAdSets = adSets.map(e => tableSerializer(e))
    const serializedAds = ads.map(e => tableSerializer(e))

    const adSetTable = {
        title   : 'Zielgruppenübersicht',
        headers : ['Zielgruppe', 'Ausgegeben', 'Schaltungen', 'Klicks', 'Konvertierungen', 'Kapitalrendite (ROI)'],
        rows    : serializedAdSets
    }
    const adsTable = {
        title   : 'Anzeigenübersicht',
        headers : ['Anzeige', 'Ausgegeben', 'Schaltungen', 'Klicks', 'Konvertierungen', 'Kapitalrendite (ROI)'],
        rows    : serializedAds
    }

    doc.table(adSetTable)
    doc.text('').moveDown(1)
    doc.table(adsTable)

    doc.end()
}

generatePDF().catch(e => console.log(e))