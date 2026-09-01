export async function downloadPDF(elementId, filename = 'laporan.pdf') {
  const element = document.getElementById(elementId)
  if (!element) {
    alert('Elemen laporan tidak ditemukan')
    return
  }

  const html2pdf = (await import('html2pdf.js')).default

  const opt = {
    margin: 8,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  html2pdf().set(opt).from(element).save()
}

export function downloadExcel(rows, filename = 'laporan.xlsx') {
  if (!rows || rows.length === 0) {
    alert('Tidak ada data untuk diunduh')
    return
  }

  const headers = Object.keys(rows[0])
  const escapeCsv = (value) => {
    const str = value == null ? '' : String(value)
    if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const csvRows = [headers.map(escapeCsv).join(';')]
  rows.forEach((row) => {
    csvRows.push(headers.map((key) => escapeCsv(row[key])).join(';'))
  })

  const csvContent = csvRows.join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadWord(rows, filename = 'laporan.doc') {
  if (!rows || rows.length === 0) {
    alert('Tidak ada data untuk diunduh')
    return
  }

  const headers = Object.keys(rows[0])
  const escapeHtml = (value) => {
    const str = value == null ? '' : String(value)
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  let tableHtml = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11px;">'
  tableHtml += '<thead><tr style="background-color:#f3f3f3;">'
  headers.forEach((header) => {
    tableHtml += `<th style="text-align:left;padding:6px;">${escapeHtml(header)}</th>`
  })
  tableHtml += '</tr></thead><tbody>'
  rows.forEach((row) => {
    tableHtml += '<tr>'
    headers.forEach((header) => {
      tableHtml += `<td style="padding:4px;">${escapeHtml(row[header])}</td>`
    })
    tableHtml += '</tr>'
  })
  tableHtml += '</tbody></table>'

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>Laporan</title></head>
    <body>
      <h2 style="font-family:Arial,sans-serif;font-size:14px;">Laporan Gaji</h2>
      ${tableHtml}
    </body>
    </html>
  `

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
