from pathlib import Path
import re

src_path = Path('c:/Users/jesus.cavalcante/Desktop/CEIC_App/index.html')
text = src_path.read_text(encoding='utf-8', errors='ignore')

# 1) Replace the VENTILATORIA UI block entirely (between start marker and the closing )})}
start_marker = "{category === 'VENTILATORIA' && (() => {"
start = text.find(start_marker)
if start == -1:
    raise SystemExit('VENTILATORIA UI block start not found')
# find the end of this IIFE block: the first occurrence of "})})}" after start
end = text.find(")})}", start)
if end == -1:
    raise SystemExit('VENTILATORIA UI block end not found')
end += len(")})}")
old_block = text[start:end]

# Build a new block based on existing but with robust normalization and debug.
new_block = """{category === 'VENTILATORIA' && (() => {
                            const norm = (s) => String(s ?? '')
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .trim()
                                .toUpperCase();

                            const selectedCatItem = (ventilatoryCatalog || []).find(i => norm(i.nome_oficial) === norm(subType));
                            const catSubType = norm(selectedCatItem?.subcategoria);

                            return (
                            <div className=\"space-y-4 animate-fade-in\">
                                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                                    <div>
                                        <label className=\"label\">Tipo</label>
                                        <SearchDropdown value={subType} onChange={(val) => {
                                            setSubType(val);
                                            setAccessoryItem(''); setHighFlowCategory('Circuito Adulto');
                                            setSelectedHighFlowItems([]); setSelectedVentAccessories([]);
                                            // Debug leve (remove depois se quiser)
                                            console.log('[VENTILATORIA] subType selecionado:', val);
                                        }}
                                            options={(ventilatoryCatalog || []).map(item => ({
                                                value: item.nome_oficial, label: item.nome_oficial
                                            }))} placeholder=\"Selecione o tipo...\" />
                                        {/* Debug visual para confirmar o catSubType */}
                                        {subType && (
                                            <div className=\"mt-2 text-[11px] text-gray-500\">
                                                <span className=\"font-mono\">DEBUG:</span> subType=<span className=\"font-mono font-bold\">{String(subType)}</span>
                                                {' '}| catSubType=<span className=\"font-mono font-bold\">{String(catSubType)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {(catSubType === 'VMNI' || catSubType === 'APENAS_ACESSORIOS') && equipmentCatalog.VENTILATORIA.types[catSubType] && (
                                        <div
                                            className=\"md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in\">
                                            <label className=\"label text-blue-800 font-bold mb-3\">Selecione os itens
                                                desejados:</label>
                                            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-2\">
                                                {equipmentCatalog.VENTILATORIA.types[catSubType].accessories.map((item) => (
                                                    <label key={item}
                                                        className=\"flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50\"><input
                                                            type=\"checkbox\" checked={selectedVentAccessories.includes(item)}
                                                            onChange={() => toggleVentAccessory(item)} className=\"w-5 h-5 text-blue-600 rounded focus:ring-blue-500\" /><span
                                                                className=\"text-gray-700 font-medium text-sm\">{item}</span></label>
                                                ))}
                                            </div>
                                            <p className=\"text-xs text-blue-600 mt-2 font-bold\">Selecionados:
                                                {selectedVentAccessories.length > 0 ? selectedVentAccessories.join(', ') : 'Nenhum'}
                                            </p>
                                        </div>
                                    )}

                                    {catSubType === 'ALTO_FLUXO' && (
                                        <div>
                                            <label className=\"label\">Categoria do Kit</label>
                                            <select value={highFlowCategory}
                                                onChange={(e) => {
                                                    setHighFlowCategory(e.target.value); setSelectedHighFlowItems([]);
                                                }} className=\"input\"><option value=\"\">Selecione Circuito...</option>
                                                {equipmentCatalog.VENTILATORIA.types.ALTO_FLUXO.accessories.map(opt => <option
                                                    key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    )}

                                </div>

                                {catSubType === 'ALTO_FLUXO' && highFlowCategory && HIGH_FLOW_OPTIONS[highFlowCategory] && (
                                    <div className=\"bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in\">
                                        <label className=\"label text-blue-800 font-bold mb-3\">Selecione os itens desejados:</label>
                                        <div className=\"space-y-2\">
                                            {HIGH_FLOW_OPTIONS[highFlowCategory].map((item) => (
                                                <label key={item}
                                                    className=\"flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50\"><input
                                                        type=\"checkbox\" checked={selectedHighFlowItems.includes(item)} onChange={() =>
                                                            toggleHighFlowItem(item)} className=\"w-5 h-5 text-blue-600 rounded focus:ring-blue-500\" /><span
                                                                className=\"text-gray-700 font-medium\">{item}</span></label>
                                            ))}
                                        </div>
                                        <p className=\"text-xs text-blue-600 mt-2 font-bold\">Selecionados:
                                            {selectedHighFlowItems.length > 0 ? selectedHighFlowItems.join(', ') : 'Nenhum'}</p>
                                    </div>
                                )}
                            </div>
                        );
                        })()}"""

text2 = text.replace(old_block, new_block)

# 2) Replace the getEquipmentPayload VENTILATORIA branch with robust norm.
# We'll locate the branch and replace until the next "} else if (category === 'TRANSPORTE')".
branch_start = "} else if (category === 'VENTILATORIA') {"
bs = text2.find(branch_start)
if bs == -1:
    raise SystemExit('VENTILATORIA payload branch start not found')
next_marker = "} else if (category === 'TRANSPORTE') {"
be = text2.find(next_marker, bs)
if be == -1:
    raise SystemExit('TRANSPORTE branch marker not found after ventilatoria')
old_payload_branch = text2[bs:be]

new_payload_branch = """} else if (category === 'VENTILATORIA') {
                    const norm = (s) => String(s ?? '')
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .trim()
                        .toUpperCase();

                    const selectedCatItem = (ventilatoryCatalog || []).find(i => norm(i.nome_oficial) === norm(subType));
                    const catSubType = norm(selectedCatItem?.subcategoria);

                    finalEquip = subType; // Grava o nome oficial (exato do catálogo)

                    if (!catSubType) {
                        showNotification('error', 'Catálogo ventilatório não encontrado para o tipo selecionado. Recarregue a página e tente novamente.');
                        return null;
                    }

                    if (catSubType === 'OXIDO') {
                        // Sem acessórios extras
                    }
                    else if (catSubType === 'ALTO_FLUXO') {
                        if (selectedHighFlowItems.length === 0) {
                            showNotification('error', 'Selecione pelo menos um item.');
                            return null;
                        }
                        finalDetails = `Kit: ${highFlowCategory} - Itens: ${selectedHighFlowItems.join(', ')}`;
                    }
                    else if (catSubType === 'VMNI' || catSubType === 'APENAS_ACESSORIOS') {
                        if (selectedVentAccessories.length === 0) {
                            showNotification('error', 'Selecione pelo menos um acessório.');
                            return null;
                        }
                        finalDetails = `Acessórios: ${selectedVentAccessories.join(', ')}`;
                    }
                    else {
                        if (accessoryItem) {
                            finalDetails = `Acessório: ${accessoryItem}`;
                        }
                    }
                """

text3 = text2.replace(old_payload_branch, new_payload_branch)

out_path = Path('c:/Users/jesus.cavalcante/Desktop/CEIC_App/index.html')
out_path.write_text(text3, encoding='utf-8')

# basic sanity checks
assert "DEBUG:" in text3
assert "Catálogo ventilatório não encontrado" in text3
