const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

let newContent = content;
const replaces = [];

// Helper
function doReplace(searchString, replaceString, desc) {
    if (newContent.includes(searchString)) {
        newContent = newContent.replace(searchString, replaceString);
        replaces.push(`SUCCESS: ${desc}`);
    } else {
        replaces.push(`FAILED: ${desc}`);
    }
}

// 1. Add mapPedido, mapEquip, normUpper etc.
const oldHelperComment = '// Funções utilitárias (helpers) compartilhadas.';
const newHelpers = `// Funções utilitárias (helpers) compartilhadas.
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
        };`;

doReplace(oldHelperComment, newHelpers, '1. Norm functions');

// 2. Fetch e Realtime
// In fetch: setRequests((reqData || []).map(mapPedido));
doReplace('setRequests((reqData || []).map(mapPedido));', 'setRequests((reqData || []).map(mapPedido).filter(Boolean));', '2a. setRequests fetch mod');
// Actually, mapping is already mapped mapPedido in some place. Oh, the app had "mapPedido" inside it? Or was it missing my new logic? My mapPedido redefines it. Let's see if original had mapPedido: "setRequests((reqData || []).map(mapPedido));" was logged as line 4436. Yes, original had some mapPedido, but I shadowed it or I need to overwrite it. So let's find the original mapPedido. We will check it later.

// Wait, the prompt says "setInventory((eqData||[]).map(mapEquip).filter(Boolean))"
doReplace('setInventory(mappedData);', 'setInventory((eqData || []).map(mapEquip).filter(Boolean));', '2b. setInventory init mod');

// Realtime INVENTORY
const oldRealtimeInvUpdate = 'setInventory(prev => prev.map(item => item.id === payload.new.id ? mapPayload(payload.new) : item));';
const newRealtimeInvUpdate = 'setInventory(prev => prev.map(item => item.id === payload.new.id ? mapEquip(payload.new) : item));';
doReplace(oldRealtimeInvUpdate, newRealtimeInvUpdate, '2c. Realtime Inv UPDATE mapEquip');

const oldRealtimeInvInsert = 'return [...prev, mapPayload(payload.new)];';
const newRealtimeInvInsert = 'return [...prev, mapEquip(payload.new)];';
doReplace(oldRealtimeInvInsert, newRealtimeInvInsert, '2d. Realtime Inv INSERT mapEquip');

console.log(replaces.join('\\n'));
fs.writeFileSync('test_applied.html', newContent);
