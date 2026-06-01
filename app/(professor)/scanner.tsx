import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Fila: cada prova tem seu QR único + imagem escaneada
type Etapa = 'qrcode' | 'preview' | 'enviando' | 'sucesso';

interface DadosQR {
    raw: string;
    id?: string;
    titulo?: string;
    descricao?: string;
}
interface ProvaFila {
    id: number;
    dadosQR: DadosQR;
    imagemUri: string;
}
interface Questao {
    questao: string;
    resposta: string;
}
interface Gabarito {
    identificador: string;
    disciplina: string;
    questoes: Questao[];
}
interface CartaoRespostas {
    estudante?: string;
    turma?: string;
    gabaritos: Gabarito[];
}
interface RespostaAPI {
    sucesso: boolean;
    dados?: { cartao_respostas: CartaoRespostas };
    mensagem?: string;
}
interface ResultadoProcessado {
    id: number;
    dadosQR: DadosQR;
    retorno: RespostaAPI;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const API_URL      = 'https://sicapteste.com.br/lucas/leitor-gabarito-ia/gabarito.php';
const COR_PRIMARIA = '#2563EB';
const COR_PERIGO   = '#DC2626';
const COR_AVISO    = '#D97706';

const COR_LETRA: Record<string, string> = {
    A: '#0EA5E9',
    B: '#0EA5E9',
    C: '#0EA5E9',
    D: '#0EA5E9',
    E: '#0EA5E9',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parsearQR(raw: string): DadosQR {
    try {
        return { raw, ...JSON.parse(raw) };
    } catch {
        return { raw, titulo: 'QR code lido', descricao: raw };
    }
}

async function enviarUmaProva(prova: ProvaFila): Promise<RespostaAPI> {
    const formData = new FormData();
    formData.append('s', prova.dadosQR.id ?? prova.dadosQR.raw);
    formData.append('imagem', {
        uri: prova.imagemUri,
        type: 'image/jpeg',
        name: 'gabarito.jpg',
    } as unknown as Blob);

    const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
    });

    const texto = await resposta.text();
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}: ${texto}`);

    try {
        return JSON.parse(texto) as RespostaAPI;
    } catch {
        return { sucesso: false, mensagem: texto };
    }
}

// ─── Sub-componente: Bolinha de alternativa ───────────────────────────────────
function Bolinha({ questao, resposta }: Questao) {
    const cor = COR_LETRA[resposta] ?? '#94A3B8';
    return (
        <View style={q.item}>
            <Text style={q.num}>{questao}</Text>
            <View style={[q.circulo, { backgroundColor: cor }]}>
                <Text style={q.letra}>{resposta ?? '?'}</Text>
            </View>
        </View>
    );
}

// ─── Sub-componente: Card de Resultado ───────────────────────────────────────
function CardResultado({ resultado }: { resultado: ResultadoProcessado }) {
    const [abaAtiva, setAbaAtiva] = useState(0);
    const { dadosQR, retorno } = resultado;

    if (!retorno.sucesso || !retorno.dados?.cartao_respostas) {
        return (
            <View style={c.card}>
                <View style={[c.header, { backgroundColor: COR_PERIGO }]}>
                    <View style={c.avatar}>
                        <Text style={c.avatarLetra}>!</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={c.nome}>Erro ao processar</Text>
                        <Text style={c.turma}>{dadosQR.titulo ?? dadosQR.raw}</Text>
                    </View>
                </View>
                <View style={{ padding: 16 }}>
                    <Text style={c.erroTexto}>{retorno.mensagem ?? 'Falha desconhecida'}</Text>
                </View>
            </View>
        );
    }

    const cartao    = retorno.dados.cartao_respostas;
    const gabarito  = cartao.gabaritos[abaAtiva];
    const estudante = cartao.estudante ?? 'Estudante';
    const turma     = cartao.turma ?? '';
    const inicial   = estudante.trim().charAt(0).toUpperCase();

    const linhas: Questao[][] = [];
    for (let i = 0; i < gabarito.questoes.length; i += 5) {
        linhas.push(gabarito.questoes.slice(i, i + 5));
    }

    return (
        <View style={c.card}>
            <View style={c.header}>
                <View style={c.avatar}>
                    <Text style={c.avatarLetra}>{inicial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={c.nome} numberOfLines={2}>{estudante}</Text>
                    {!!turma && <Text style={c.turma}>{turma}</Text>}
                </View>
            </View>
            <View style={c.tagQR}>
                <Text style={c.tagQRTexto}>🔗  QR · {dadosQR.titulo ?? dadosQR.raw}</Text>
            </View>
            <View style={c.abas}>
                {cartao.gabaritos.map((g, idx) => (
                    <Pressable
                        key={g.identificador}
                        style={[c.aba, abaAtiva === idx && c.abaAtiva]}
                        onPress={() => setAbaAtiva(idx)}
                    >
                        <Text style={[c.abaTexto, abaAtiva === idx && c.abaTextoAtivo]} numberOfLines={1}>
                            {g.disciplina.split(' ')[0]}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <Text style={c.disciplina}>{gabarito.disciplina}</Text>
            <View style={c.grade}>
                {linhas.map((linha, li) => (
                    <View key={li} style={c.linha}>
                        {linha.map((q) => <Bolinha key={q.questao} {...q} />)}
                    </View>
                ))}
            </View>
            <View style={c.legenda}>
                {Object.entries(COR_LETRA).map(([letra, cor]) => (
                    <View key={letra} style={c.legendaItem}>
                        <View style={[c.dot, { backgroundColor: cor }]} />
                        <Text style={c.legendaTexto}>{letra}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

// ─── Sub-componente: Miniatura da fila ───────────────────────────────────────
function ItemFila({ prova, index, onRemover }: { prova: ProvaFila; index: number; onRemover: () => void }) {
    return (
        <View style={f.item}>
            <Image source={{ uri: prova.imagemUri }} style={f.thumb} resizeMode="cover" />
            <View style={f.info}>
                <Text style={f.num}>Prova {index + 1}</Text>
                <Text style={f.qr} numberOfLines={1}>
                    🔗 {prova.dadosQR.titulo ?? prova.dadosQR.raw}
                </Text>
            </View>
            <Pressable style={f.remover} onPress={onRemover}>
                <Text style={f.removerTexto}>✕</Text>
            </Pressable>
        </View>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Scanner() {
    const [etapa, setEtapa]           = useState<Etapa>('qrcode');
    // QR sendo lido agora (temporário, até escanear a imagem)
    const [dadosQRAtual, setDadosQRAtual] = useState<DadosQR | null>(null);
    const [jaLeu, setJaLeu]           = useState(false);
    // Fila de provas prontas para enviar
    const [fila, setFila]             = useState<ProvaFila[]>([]);
    // Imagem recém-escaneada aguardando confirmação
    const [imagemPreview, setImagemPreview] = useState<string | null>(null);
    // Progresso do envio em lote
    const [progresso, setProgresso]   = useState({ atual: 0, total: 0 });
    // Resultados finais
    const [resultados, setResultados] = useState<ResultadoProcessado[]>([]);
    const proximoId                   = useRef(1);

    const [permCamera, pedirPermCamera] = useCameraPermissions();
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const fadeIn = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    };

    // ── QR lido ───────────────────────────────────────────────────────────────
    const aoLerQR = ({ data }: { data: string }) => {
        if (jaLeu) return;
        setJaLeu(true);
        const qr = parsearQR(data);
        setDadosQRAtual(qr);
        abrirScanner(qr);
    };

    // ── Abrir DocumentScanner ─────────────────────────────────────────────────
    const abrirScanner = async (qr: DadosQR) => {
        try {
            const result = await DocumentScanner.scanDocument();
            if (!result?.scannedImages?.length) {
                Alert.alert('Nenhum documento detectado', 'Tente enquadrar melhor a folha.');
                setJaLeu(false);
                return;
            }
            setImagemPreview(result.scannedImages[0]);
            fadeIn();
            setEtapa('preview');
        } catch {
            Alert.alert('Erro', 'Falha ao abrir o scanner.');
            setJaLeu(false);
        }
    };

    // ── Confirmar imagem: adiciona na fila e volta para câmera QR ─────────────
    const confirmarEAdicionarMais = () => {
        if (!imagemPreview || !dadosQRAtual) return;
        setFila(prev => [...prev, {
            id: proximoId.current++,
            dadosQR: dadosQRAtual,
            imagemUri: imagemPreview,
        }]);
        // Limpa estado temporário e volta para câmera QR
        setImagemPreview(null);
        setDadosQRAtual(null);
        setJaLeu(false);
        setEtapa('qrcode');
    };

    // ── Confirmar imagem: adiciona na fila e envia tudo ───────────────────────
    const confirmarEEnviar = () => {
        if (!imagemPreview || !dadosQRAtual) return;
        const filaFinal: ProvaFila[] = [...fila, {
            id: proximoId.current++,
            dadosQR: dadosQRAtual,
            imagemUri: imagemPreview,
        }];
        setFila(filaFinal);
        setImagemPreview(null);
        setDadosQRAtual(null);
        enviarTodas(filaFinal);
    };

    // ── Refazer escaneamento da prova atual ───────────────────────────────────
    const refazer = () => {
        if (dadosQRAtual) abrirScanner(dadosQRAtual);
    };

    // ── Remover prova da fila ─────────────────────────────────────────────────
    const removerDaFila = (id: number) => {
        setFila(prev => prev.filter(p => p.id !== id));
    };

    // ── Enviar todas as provas em paralelo ────────────────────────────────────
    const enviarTodas = async (filaParaEnviar: ProvaFila[]) => {
        setEtapa('enviando');
        setProgresso({ atual: 0, total: filaParaEnviar.length });

        const resultadosFinais: ResultadoProcessado[] = [];

        // Envia em paralelo com Promise.allSettled para não abortar se uma falhar
        const promises = filaParaEnviar.map(async (prova) => {
            try {
                const retorno = await enviarUmaProva(prova);
                return { id: prova.id, dadosQR: prova.dadosQR, retorno };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Erro desconhecido';
                return {
                    id: prova.id,
                    dadosQR: prova.dadosQR,
                    retorno: { sucesso: false, mensagem: msg } as RespostaAPI,
                };
            }
        });

        // Atualiza contador conforme cada uma termina
        const settled = await Promise.allSettled(
            promises.map(async (p, i) => {
                const res = await p;
                setProgresso(prev => ({ ...prev, atual: prev.atual + 1 }));
                return res;
            })
        );

        settled.forEach(s => {
            if (s.status === 'fulfilled') resultadosFinais.push(s.value);
        });

        setResultados(resultadosFinais);
        fadeIn();
        setEtapa('sucesso');
    };

    // ── Enviar fila atual (botão na tela qrcode) ──────────────────────────────
    const enviarFilaAtual = () => {
        if (fila.length === 0) return;
        enviarTodas(fila);
    };

    // ── Reiniciar tudo ────────────────────────────────────────────────────────
    const reiniciar = () => {
        setEtapa('qrcode');
        setDadosQRAtual(null);
        setJaLeu(false);
        setFila([]);
        setImagemPreview(null);
        setProgresso({ atual: 0, total: 0 });
        setResultados([]);
        proximoId.current = 1;
    };

    // ─── Permissão de câmera ──────────────────────────────────────────────────
    if (!permCamera) {
        return (
            <View style={s.centro}>
                <ActivityIndicator size="large" color={COR_PRIMARIA} />
            </View>
        );
    }

    if (!permCamera.granted) {
        return (
            <View style={s.centro}>
                <Text style={s.textoInfo}>Precisamos da permissão da câmera</Text>
                <Pressable style={[s.botao, { marginTop: 20 }]} onPress={pedirPermCamera}>
                    <Text style={s.botaoTexto}>Conceder permissão</Text>
                </Pressable>
            </View>
        );
    }

    // ─── Tela: QR Code ────────────────────────────────────────────────────────
    if (etapa === 'qrcode') {
        return (
            <View style={s.tela}>
                <View style={s.cabecalho}>
                    <Text style={s.titulo}>Leitor de Gabarito</Text>
                    <Text style={s.subtitulo}>
                        {fila.length > 0
                            ? `${fila.length} prova${fila.length !== 1 ? 's' : ''} na fila · Aponte para o próximo QR`
                            : 'Aponte para o QR code da folha'}
                    </Text>
                </View>
                <View style={s.cameraWrapper}>
                    <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={aoLerQR}
                    />
                    <View style={s.miraOverlay} pointerEvents="none">
                        <View style={s.mira}>
                            <View style={[s.canto, s.tl]} />
                            <View style={[s.canto, s.tr]} />
                            <View style={[s.canto, s.bl]} />
                            <View style={[s.canto, s.br]} />
                        </View>
                        {jaLeu && (
                            <View style={s.lendoBadge}>
                                <ActivityIndicator size="small" color="#FFF" />
                                <Text style={s.lendoTexto}>QR detectado — abrindo scanner…</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={s.rodape}>
                    <Text style={s.dica}>🔍 Mantenha o QR code centralizado</Text>
                    {fila.length > 0 && (
                        <Pressable style={s.botaoEnviarFila} onPress={enviarFilaAtual}>
                            <Text style={s.botaoEnviarFilaTexto}>
                                Enviar {fila.length} prova{fila.length !== 1 ? 's' : ''}  ✓
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    }

    // ─── Tela: Preview ────────────────────────────────────────────────────────
    if (etapa === 'preview' && imagemPreview) {
        const totalNaFila = fila.length + 1; // +1 = a atual
        return (
            <Animated.View style={[s.tela, { opacity: fadeAnim }]}>
                <View style={s.cabecalho}>
                    <Text style={s.titulo}>Prova {totalNaFila}</Text>
                    <Text style={s.subtitulo}>
                        🔗 {dadosQRAtual?.titulo ?? dadosQRAtual?.raw ?? ''}
                    </Text>
                </View>

                <Image source={{ uri: imagemPreview }} style={s.preview} resizeMode="contain" />

                {/* Miniaturas das provas já na fila */}
                {fila.length > 0 && (
                    <ScrollView
                        horizontal
                        style={s.filaScroll}
                        contentContainerStyle={s.filaScrollContent}
                        showsHorizontalScrollIndicator={false}
                    >
                        {fila.map((prova, index) => (
                            <ItemFila
                                key={prova.id}
                                prova={prova}
                                index={index}
                                onRemover={() => removerDaFila(prova.id)}
                            />
                        ))}
                    </ScrollView>
                )}

                <View style={s.acoes}>
                    {/* Refazer a foto atual */}
                    <Pressable style={[s.botao, s.botaoPerigo, s.botaoIcone]} onPress={refazer}>
                        <Text style={s.botaoTexto}>↩</Text>
                    </Pressable>
                    {/* Adicionar mais uma prova */}
                    <Pressable style={[s.botao, s.botaoSecundario]} onPress={confirmarEAdicionarMais}>
                        <Text style={s.botaoTextoSecundario}>+ Adicionar prova</Text>
                    </Pressable>
                    {/* Enviar todas */}
                    <Pressable style={s.botao} onPress={confirmarEEnviar}>
                        <Text style={s.botaoTexto}>
                            Enviar {totalNaFila}  ✓
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        );
    }

    // ─── Tela: Enviando ───────────────────────────────────────────────────────
    if (etapa === 'enviando') {
        const pct = progresso.total > 0
            ? Math.round((progresso.atual / progresso.total) * 100)
            : 0;
        return (
            <View style={s.centro}>
                <ActivityIndicator size="large" color={COR_PRIMARIA} />
                <Text style={[s.textoInfo, { marginTop: 16 }]}>
                    Analisando gabarito{progresso.total > 1 ? 's' : ''}…
                </Text>
                {progresso.total > 1 && (
                    <>
                        <Text style={s.progressoTexto}>
                            {progresso.atual} de {progresso.total} provas processadas
                        </Text>
                        <View style={s.barraFundo}>
                            <View style={[s.barraPreenchimento, { width: `${pct}%` as any }]} />
                        </View>
                    </>
                )}
            </View>
        );
    }

    // ─── Tela: Sucesso ────────────────────────────────────────────────────────
    if (etapa === 'sucesso') {
        const sucessos = resultados.filter(r => r.retorno.sucesso).length;
        const falhas   = resultados.length - sucessos;

        return (
            <Animated.View style={[s.tela, { opacity: fadeAnim }]}>
                <ScrollView
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Badge resumo */}
                    <View style={[s.badgeSucesso, falhas > 0 && s.badgeAviso]}>
                        <Text style={[s.badgeSucessoTexto, falhas > 0 && s.badgeAvisoTexto]}>
                            {falhas === 0
                                ? `✓  ${sucessos} prova${sucessos !== 1 ? 's' : ''} processada${sucessos !== 1 ? 's' : ''} com sucesso`
                                : `⚠  ${sucessos} ok · ${falhas} com erro`}
                        </Text>
                    </View>

                    {/* Cards de resultado */}
                    {resultados.map(res => (
                        <CardResultado key={res.id} resultado={res} />
                    ))}

                    {/* Botão reiniciar */}
                    <Pressable style={[s.botao, { marginTop: 8 }]} onPress={reiniciar}>
                        <Text style={s.botaoTexto}>Novo lote de provas</Text>
                    </Pressable>
                </ScrollView>
            </Animated.View>
        );
    }

    return null;
}

// ─── Estilos globais ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
    tela:      { flex: 1, backgroundColor: '#F1F5F9' },
    centro:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#F1F5F9' },
    cabecalho: { paddingTop: 58, paddingHorizontal: 24, paddingBottom: 12 },
    titulo:    { fontSize: 22, fontWeight: '700', color: '#0F172A' },
    subtitulo: { fontSize: 14, color: '#64748B', marginTop: 4 },
    // Câmera
    cameraWrapper: { flex: 1, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
    miraOverlay:   { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 16 },
    mira:          { width: 220, height: 220, position: 'relative' },
    canto:         { position: 'absolute', width: 28, height: 28, borderColor: '#FFF' },
    tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    lendoBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(37,99,235,0.85)',
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    },
    lendoTexto: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    rodape:     { padding: 20, alignItems: 'center', gap: 12 },
    dica:       { fontSize: 13, color: '#94A3B8' },
    botaoEnviarFila: {
        backgroundColor: COR_PRIMARIA,
        paddingVertical: 12, paddingHorizontal: 32,
        borderRadius: 24,
    },
    botaoEnviarFilaTexto: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    // Preview
    preview:          { flex: 1, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, backgroundColor: '#1E293B' },
    // Fila de miniaturas
    filaScroll:        { maxHeight: 88, flexGrow: 0, marginHorizontal: 16, marginBottom: 8 },
    filaScrollContent: { gap: 8, paddingHorizontal: 4 },
    // Ações
    acoes: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
    // Botões
    botao:                { flex: 1, backgroundColor: COR_PRIMARIA, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    botaoTexto:           { color: '#FFF', fontSize: 14, fontWeight: '700' },
    botaoPerigo:          { backgroundColor: COR_PERIGO },
    botaoIcone:           { flex: 0, width: 48, paddingHorizontal: 0 },
    botaoSecundario:      { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: COR_PRIMARIA },
    botaoTextoSecundario: { color: COR_PRIMARIA, fontSize: 14, fontWeight: '700' },
    // Scroll resultado
    scrollContent: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 48 },
    // Badges
    badgeSucesso:      { backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, alignItems: 'center' },
    badgeSucessoTexto: { color: '#16A34A', fontSize: 13, fontWeight: '600' },
    badgeAviso:        { backgroundColor: '#FEF3C7' },
    badgeAvisoTexto:   { color: COR_AVISO },
    // Fallback
    cardFallback: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
    textoInfo:    { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22 },
    // Progresso
    progressoTexto:      { fontSize: 13, color: '#64748B', marginTop: 8 },
    barraFundo:          { width: '80%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    barraPreenchimento:  { height: 6, backgroundColor: COR_PRIMARIA, borderRadius: 3 },
});

// ─── Estilos card resultado ───────────────────────────────────────────────────
const c = StyleSheet.create({
    card: {
        backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', width: '100%',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 }, elevation: 4, marginBottom: 20,
    },
    header:       { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#1E3A8A', gap: 14 },
    avatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarLetra:  { color: '#FFF', fontSize: 22, fontWeight: '700' },
    nome:         { color: '#FFF', fontSize: 15, fontWeight: '700', lineHeight: 20 },
    turma:        { color: '#93C5FD', fontSize: 12, marginTop: 2 },
    erroTexto:    { fontSize: 14, color: '#475569', textAlign: 'center' },
    tagQR:        { backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
    tagQRTexto:   { fontSize: 11, color: '#2563EB', fontWeight: '500' },
    abas:         { flexDirection: 'row', backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    aba:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
    abaAtiva:     { borderBottomWidth: 2, borderBottomColor: COR_PRIMARIA, backgroundColor: '#FFF' },
    abaTexto:     { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
    abaTextoAtivo:{ color: COR_PRIMARIA, fontWeight: '700' },
    disciplina:   { fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'center', paddingTop: 14, paddingHorizontal: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    grade:        { padding: 16, gap: 10 },
    linha:        { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    legenda:      { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingBottom: 16, paddingTop: 4 },
    legendaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot:          { width: 8, height: 8, borderRadius: 4 },
    legendaTexto: { fontSize: 11, color: '#64748B', fontWeight: '600' },
});

// ─── Estilos item da fila ─────────────────────────────────────────────────────
const f = StyleSheet.create({
    item:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 8, gap: 8, width: 200, borderWidth: 1, borderColor: '#E2E8F0' },
    thumb:       { width: 52, height: 68, borderRadius: 6, backgroundColor: '#1E293B' },
    info:        { flex: 1 },
    num:         { fontSize: 12, fontWeight: '700', color: '#0F172A' },
    qr:          { fontSize: 10, color: '#64748B', marginTop: 2 },
    remover:     { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
    removerTexto:{ fontSize: 11, color: COR_PERIGO, fontWeight: '700' },
});

// ─── Estilos bolinhas ─────────────────────────────────────────────────────────
const q = StyleSheet.create({
    item:    { alignItems: 'center', gap: 4, width: 48 },
    num:     { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
    circulo: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    letra:   { color: '#FFF', fontSize: 15, fontWeight: '700' },
});