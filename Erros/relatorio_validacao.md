# Alterações aplicadas

- Ajuste: toSnakeCase agora converte camelCase para minúsculo sem underscore (compatível com tabela pedidos)
- Ajuste: db.pedidos agora bloqueia insert/update quando payload contém undefined (com log das chaves)
- Try/catch adicionado em handleCreateRequest
- Try/catch adicionado em handleRequestPickup
- Try/catch adicionado em handleConfirmReceipt
- DEBUG_LOGS: todos console.log agora são condicionais (if DEBUG_LOGS)
