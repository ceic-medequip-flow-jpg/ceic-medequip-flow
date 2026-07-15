const fs = require('fs');
const content = fs.readFileSync('c:/Users/Usuario/Desktop/CEIC_App/src/App.jsx', 'utf8');
const lines = content.split('\n');

const newLines = `    const handleConfirmTransferClick = (item) => {
        setSelectedItem(item);
        setCollaboratorName('');
        setCollaboratorBadge('');
        setReceiptActionType('transfer');
        setReceiptModalOpen(true);
    };

    const handleReceiptClick = (item) => {
        setSelectedItem(item);
        setCollaboratorName('');
        setCollaboratorBadge('');
        setReceiptActionType('receipt');
        setReceiptModalOpen(true);
    };

    const confirmReceiptSubmit = async () => {
        if (!collaboratorName || !collaboratorBadge) {
            showNotification('error', 'Preencha nome e matrícula.');
            return;
        }
        setConfirmingReceiptTag(selectedItem.tag);
        
        let ok = false;
        if (receiptActionType === 'transfer') {
            const pedido = requests.find(r => normUpper(r.equipmentTag).includes(normUpper(selectedItem.tag)) && r.status === 'in_transfer');
            try {
                await onConfirmTransfer(selectedItem, pedido, { name: collaboratorName, badge: collaboratorBadge });
                ok = true;
            } catch (err) {
                ok = false;
            }
        } else {
            ok = await onConfirmReceipt({ equipmentTag: selectedItem.tag, collaboratorName, collaboratorBadge });
        }
        
        setConfirmingReceiptTag(null);
        if (ok) setReceiptModalOpen(false);
    };`.split('\n');

lines.splice(3515, 18, ...newLines);
fs.writeFileSync('c:/Users/Usuario/Desktop/CEIC_App/src/App.jsx', lines.join('\n'), 'utf8');