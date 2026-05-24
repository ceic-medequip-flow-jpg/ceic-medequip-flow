import re

filepath = r"c:\Users\jesus.cavalcante\Desktop\CEIC_App\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace EQUIPMENT_DATA constant with STATIC_AUX_DATA
equip_data_regex = r"const EQUIPMENT_DATA = \{[\s\S]*?\n        \};\n\n        const HIGH_FLOW_OPTIONS"
static_aux_data = """const STATIC_AUX_DATA = {
            GERAIS: {
                accessoryItems: ["Espaçador / Aeropuff", "Célula de Capnografia", "20 Sacos para acondicionamento de circuitos (saco infectante)"]
            },
            VENTILATORIA: {
                types: {
                    VMI: { accessories: ["Umidificação Passiva", "Umidificação ativa"] },
                    VMNI: { accessories: ["Circuito", "Circuito BPAP", "Circuito CPAP", "Máscara Orofacial (sem válvula exalatória)", "Máscara Orofacial (com válvula exalatória)", "Máscara Performax (sem válvula exalatória - azul)", "Máscara Performax (com válvula exalatória - branca/laranja)", "Máscara Nasal"] },
                    ALTO_FLUXO: { accessories: ["Circuito Adulto", "Circuito Infantil"] },
                    OXIDO: { accessories: [] },
                    APENAS_ACESSORIOS: { accessories: ["Umidificação Passiva", "Umidificação ativa"] }
                }
            },
            TRANSPORTE: {
                destinations: ["Centro cirúrgico 9º PAMB", "ICESP", "INCOR", "IOT", "Ressonância magnética", "Tomografia 3o andar", "Tomografia 4o andar", "Radiologia intervencionista", "11DN", "11DS", "11EE", "11FF", "11GN", "09UAN/UAC - PAMB 9", "07AA - UTI", "04GN", "04GS", "PS - Sala de emergência cirúrgica", "PS -Sala de emergência clínica"]
            }
        };

        const HIGH_FLOW_OPTIONS"""

content = re.sub(equip_data_regex, static_aux_data, content)

# 2. Add state inside App()
app_regex = r"(export default function App\(\) \{.*?const \[requests, setRequests\] = useState\(\[\]\);)"
app_replacement = r"\1\n            const [equipmentCatalog, setEquipmentCatalog] = useState(null);"
content = re.sub(app_regex, app_replacement, content, flags=re.DOTALL)

# 3. Add fetch logic inside fetchInitialData
fetch_regex = r"(// Busca pedidos\n\s*const \{ data: reqData, error: reqError \} = await supabaseClient.*?setRequests\(reqData\);\n\s*}\s*)"

fetch_catalog_logic = """\\1
                    // Busca catálogo de equipamentos
                    const { data: catData, error: catError } = await supabaseClient.from('catalogo_equipamentos').select('*');
                    if (catData && !catError) {
                        const newCatalog = {
                            GERAIS: {
                                label: "Equipamentos Gerais",
                                items: catData.filter(i => i.categoria === 'GERAIS').map(i => i.nome_oficial),
                                accessoryItems: STATIC_AUX_DATA.GERAIS.accessoryItems
                            },
                            VENTILATORIA: {
                                label: "Equipamentos de Assistência Ventilatória",
                                types: {}
                            },
                            TRANSPORTE: {
                                label: "Equipamentos para Transporte de Paciente",
                                items: catData.filter(i => i.categoria === 'TRANSPORTE').map(i => i.nome_oficial),
                                destinations: STATIC_AUX_DATA.TRANSPORTE.destinations
                            }
                        };
                        
                        catData.filter(i => i.categoria === 'VENTILATORIA').forEach(item => {
                            const sub = item.subcategoria || item.nome_oficial;
                            let key = sub;
                            if (newCatalog.VENTILATORIA.types[sub] && newCatalog.VENTILATORIA.types[sub].label !== item.nome_oficial) {
                                key = item.nome_oficial; 
                            }
                            newCatalog.VENTILATORIA.types[key] = {
                                label: item.nome_oficial,
                                accessories: STATIC_AUX_DATA.VENTILATORIA.types[sub]?.accessories || []
                            };
                        });

                        setEquipmentCatalog(newCatalog);
                    } else if (catError) {
                        console.error("Erro ao buscar catálogo:", catError);
                    }
"""

content = re.sub(fetch_regex, fetch_catalog_logic, content, count=1)

# 4. Add Loading state inside App before return
return_regex = r"(\s*)(return \(\s*<div className=\"min-h-screen bg-gray-50 flex flex-col md:flex-row\">)"
loading_logic = r"\1if (!equipmentCatalog) return <div className=\"p-10 text-center font-bold text-gray-600\">Carregando catálogo de equipamentos...</div>;\1\2"
content = re.sub(return_regex, loading_logic, content, count=1)

# 5. Pass equipmentCatalog to NewRequestForm via AdminEntregaWrapper
admin_wrapper_def_regex = r"(const AdminEntregaWrapper = \(\{ onCreateRequest, showNotification, onBack, adminProfile \}\) => \{)"
admin_wrapper_def_repl = r"const AdminEntregaWrapper = ({ onCreateRequest, showNotification, onBack, adminProfile, equipmentCatalog }) => {"
content = re.sub(admin_wrapper_def_regex, admin_wrapper_def_repl, content)

admin_wrapper_use_regex = r"(<NewRequestForm[^>]*adminProfile=\{adminProfile\})"
admin_wrapper_use_repl = r"\1 equipmentCatalog={equipmentCatalog}"
content = re.sub(admin_wrapper_use_regex, admin_wrapper_use_repl, content)

# pass to NewRequestForm
new_request_def_regex = r"(const NewRequestForm = \(\{ onCreateRequest, showNotification, sectorSelo, onBack, adminProfile \}\) => \{)"
new_request_def_repl = r"const NewRequestForm = ({ onCreateRequest, showNotification, sectorSelo, onBack, adminProfile, equipmentCatalog }) => {"
content = re.sub(new_request_def_regex, new_request_def_repl, content)

# 6. Replace EQUIPMENT_DATA with equipmentCatalog globally
content = content.replace("EQUIPMENT_DATA", "equipmentCatalog")

# 7. Add equipmentCatalog to AdminEntregaWrapper rendering and NewRequestForm rendering in App
app_render_admin_regex = r"(<AdminEntregaWrapper\s*onCreateRequest=\{[^\}]*\}\s*showNotification=\{[^\}]*\}\s*onBack=\{[^\}]*\}\s*adminProfile=\{[^\}]*\})(\s*/>)"
app_render_admin_repl = r"\1 equipmentCatalog={equipmentCatalog}\2"
content = re.sub(app_render_admin_regex, app_render_admin_repl, content)

app_render_requester_regex = r"(<NewRequestForm\s*onCreateRequest=\{[^\}]*\}\s*showNotification=\{[^\}]*\}\s*sectorSelo=\{[^\}]*\}\s*onBack=\{[^\}]*\})(\s*/>)"
app_render_requester_repl = r"\1 equipmentCatalog={equipmentCatalog}\2"
content = re.sub(app_render_requester_regex, app_render_requester_repl, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
