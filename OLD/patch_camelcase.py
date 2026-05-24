import re

replacements = {
    'equipmenttype:': 'equipmentType:',
    'equipmenttag:': 'equipmentTag:',
    'patientname:': 'patientName:',
    'patientmv:': 'patientMV:',
    'patientbed:': 'patientBed:',
    'requestername:': 'requesterName:',
    'requesterbadge:': 'requesterBadge:',
    'requesterrole:': 'requesterRole:',
    'isurgent:': 'isUrgent:',
    'fulfilledby:': 'fulfilledBy:',
    'fulfilledat:': 'fulfilledAt:',
    'cancelreason:': 'cancelReason:',
    'cancelledbyinfo:': 'cancelledByInfo:',
    'cancelledat:': 'cancelledAt:',
    'iswaitlisted:': 'isWaitlisted:',
    'waitlisttime:': 'waitlistTime:',
    'notificationmessage:': 'notificationMessage:',
    'notificationtype:': 'notificationType:',
    'notificationtime:': 'notificationTime:',
    'specificlocation:': 'specificLocation:',
    'inusesince:': 'inUseSince:',
    'receivedbysector:': 'receivedBySector:',
    'arrivaltime:': 'arrivalTime:',
    'departuretime:': 'departureTime:',
    'returntounittime:': 'returnToUnitTime:',
    'returntoceictime:': 'returnToCeicTime:',
    'defectdescription:': 'defectDescription:',
    'unitnotified:': 'unitNotified:',
    'notificationnumber:': 'notificationNumber:',
    'patientdamage:': 'patientDamage:',
    'servicerequestnumber:': 'serviceRequestNumber:',
    'previouslocation:': 'previousLocation:',
    'returndate:': 'returnDate:',
    'returnedallaccessories:': 'returnedAllAccessories:',
    'transferstatus:': 'transferStatus:',
    'transferto:': 'transferTo:',
    'transfertobed:': 'transferToBed:',
    'transferby:': 'transferBy:',
    'transferrejected:': 'transferRejected:',
    'preventivescheduled:': 'preventiveScheduled:',
    'preventivescheduledat:': 'preventiveScheduledAt:',
    'preventivesegregatedat:': 'preventiveSegregatedAt:',
    'lastcleaned:': 'lastCleaned:'
}

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

for old, new in replacements.items():
    content = re.sub(r'\b' + old, new, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
