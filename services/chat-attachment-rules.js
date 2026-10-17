const MAX_BYTES = 10 * 1024 * 1024
function inspectAttachment(name, bytes) {
 const fail = message => { throw Object.assign(new Error(message), { status: 400 }) }
 if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_BYTES) fail('Choose a file between 1 byte and 10 MB.')
 name = String(name || '').split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0,180)
 if (!name) fail('A file name is required.')
 const ext = name.split('.').pop().toLowerCase()
 const starts = value => bytes.subarray(0,value.length).equals(Buffer.from(value))
 let mime
 if (['jpg','jpeg'].includes(ext) && starts([255,216,255])) mime='image/jpeg'
 else if (ext==='png' && starts([137,80,78,71,13,10,26,10])) mime='image/png'
 else if (ext==='gif' && /^GIF8[79]a/.test(bytes.subarray(0,6).toString())) mime='image/gif'
 else if (ext==='webp' && bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') mime='image/webp'
 else if (ext==='pdf' && starts(Buffer.from('%PDF-'))) mime='application/pdf'
 else if (['zip','docx','xlsx','pptx'].includes(ext) && starts([80,75,3,4])) mime='application/zip'
 else if (['txt','csv'].includes(ext) && !bytes.includes(0)) mime='text/plain'
 else fail('Supported files: JPG, PNG, GIF, WebP, PDF, TXT, CSV, ZIP, DOCX, XLSX and PPTX. The file contents must match its type.')
 return { name, mime, size: bytes.length }
}
module.exports = { MAX_BYTES, inspectAttachment }
