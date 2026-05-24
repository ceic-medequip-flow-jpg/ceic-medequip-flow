const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// The required changes can mostly be applied by finding the correct functions in the string and modifying them.

// 1) Add global helpers around line 125, after // =========================================================
// FUNÇÕES DE AJUDA GERAIS (HELPERS)
const helpersStr = `
        const normText = (s) => String(s ?? '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
        const normUpper = (s) => normText(s).toUpperCase();
        const normLower = (s) => normText(s).toLowerCase();

        const mapPedido = (raw) => {
            if (!raw) return null;
            return {
                ...raw,
                status: normLower(raw.status || raw.Status || ''),
                equipmentType: normUpper(raw.equipmentType || raw.equipmenttype || raw["equipmentType"] || raw["equipmenttype"] || ''),
                equipmentTag: normUpper(raw.equipmentTag || raw.equipmenttag || raw["equipmentTag"] || raw["equipmenttag"] || ''),
                patientName: raw.patientName || raw.patientname || '',
                patientMV: raw.patientMV || raw.patientmv || '',
                patientBed: raw.patientBed || raw.patientbed || '',
                requesterName: raw.requesterName || raw.requestername || '',
                requesterBadge: raw.requesterBadge || raw.requesterbadge || '',
                accessories: Array.isArray(raw.accessories) ? raw.accessories : (typeof raw.accessories === 'string' ? [raw.accessories] : [])
            };
        };

        const mapEquip = (raw) => {
            if (!raw) return null;
            return {
                ...raw,
                tag: normUpper(raw.tag || raw.TAG || raw["TAG"] || ''),
                type: normUpper(raw.type || raw.Equipamento || raw["Equipamento"] || ''),
                status: normLower(raw.status || raw.Status || 'available'),
                location: String(raw.location || '').trim(),
                model: String(raw.model || '').trim(),
                transferStatus: raw.transferStatus,
                transferTo: raw.transferTo,
                transferToBed: raw.transferToBed,
                transferRejected: raw.transferRejected,
                receivedBySector: raw.receivedBySector,
                previousLocation: raw.previousLocation,
                specificLocation: raw.specificLocation
            };
        };
`;

if (!content.includes('normText')) {
    content = content.replace(
        '// Funções utilitárias (helpers) compartilhadas.',
        '// Funções utilitárias (helpers) compartilhadas.\n' + helpersStr
    );
}

// Write the script to output so I can run it
fs.writeFileSync(filePath + '.temp', content);
console.log('Script ran ok.');
