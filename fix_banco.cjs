const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Corrige as colunas da tabela pedidos
code = code.replace(/fulfilledBy:/g, 'fulfilledby:');
code = code.replace(/equipmentTag:/g, 'equipmenttag:');
code = code.replace(/fulfilledAt:/g, 'fulfilledat:');
code = code.replace(/cancelReason:/g, 'cancelreason:');
code = code.replace(/cancelledByInfo:/g, 'cancelledbyinfo:');
code = code.replace(/cancelledAt:/g, 'cancelledat:');
code = code.replace(/isWaitlisted:/g, 'iswaitlisted:');
code = code.replace(/waitlistTime:/g, 'waitlisttime:');
code = code.replace(/notificationMessage:/g, 'notificationmessage:');
code = code.replace(/notificationType:/g, 'notificationtype:');
code = code.replace(/notificationTime:/g, 'notificationtime:');

// Corrige as colunas da tabela equipamentos
code = code.replace(/specificLocation:/g, 'specificlocation:');
code = code.replace(/patientMV:/g, 'patientmv:');
code = code.replace(/patientName:/g, 'patientname:');
code = code.replace(/inUseSince:/g, 'inusesince:');
code = code.replace(/receivedBySector:/g, 'receivedbysector:');
code = code.replace(/transferStatus:/g, 'transferstatus:');
code = code.replace(/transferTo:/g, 'transferto:');
code = code.replace(/transferToBed:/g, 'transfertobed:');
code = code.replace(/transferBy:/g, 'transferby:');
code = code.replace(/transferRejected:/g, 'transferrejected:');
code = code.replace(/preventiveScheduled:/g, 'preventivescheduled:');
code = code.replace(/preventiveScheduledAt:/g, 'preventivescheduledat:');
code = code.replace(/preventiveSegregatedAt:/g, 'preventivesegregatedat:');
code = code.replace(/unitNotified:/g, 'unitnotified:');
code = code.replace(/notificationNumber:/g, 'notificationnumber:');
code = code.replace(/serviceRequestNumber:/g, 'servicerequestnumber:');
code = code.replace(/patientDamage:/g, 'patientdamage:');
code = code.replace(/defectDescription:/g, 'defectdescription:');
code = code.replace(/returnedAllAccessories:/g, 'returnedallaccessories:');
code = code.replace(/previousLocation:/g, 'previouslocation:');
code = code.replace(/returnDate:/g, 'returndate:');

fs.writeFileSync('src/App.jsx', code);
console.log('Todas as chaves do banco de dados foram corrigidas para minúsculas!');
