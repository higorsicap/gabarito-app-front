import BottomNav from '@/src/components/BottomNav';
import {
    contarPendentes,
    copiarImagemParaPermanente,
    marcarSincronizado,
    obterPendentes,
    salvaGabarito,
    type ProvaSync,
} from '@/src/database/services/leitorGabaritoRepository';
import NetInfo from '@react-native-community/netinfo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Etapa = 'inicio' | 'qrcode' | 'preview' | 'enviando' | 'sucesso' | 'sincronizando';

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
const COR_OFFLINE  = '#64748B';

const COR_LETRA: Record<string, string> = {
    A: '#0EA5E9', B: '#0EA5E9', C: '#0EA5E9', D: '#0EA5E9', E: '#0EA5E9',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parsearQR(raw: string): DadosQR {
    try { return { raw, ...JSON.parse(raw) }; }
    catch { return { raw, titulo: 'QR code lido', descricao: raw }; }
}

async function enviarUmaProva(imagemUri: string, idProva: string): Promise<RespostaAPI> {
    const formData = new FormData();
    formData.append('s', idProva);
    formData.append('imagem', {
        uri: imagemUri,
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

    try { return JSON.parse(texto) as RespostaAPI; }
    catch { return { sucesso: false, mensagem: texto }; }
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
                    <View style={c.avatar}><Text style={c.avatarLetra}>!</Text></View>
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
    for (let i = 0; i < gabarito.questoes.length; i += 5)
        linhas.push(gabarito.questoes.slice(i, i + 5));

    return (
        <View style={c.card}>
            <View style={c.header}>
                <View style={c.avatar}><Text style={c.avatarLetra}>{inicial}</Text></View>
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
function ItemFila({ prova, index, onRemover }: {
    prova: ProvaFila; index: number; onRemover: () => void;
}) {
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

// ─── Sub-componente: Banner de status de rede ─────────────────────────────────
function BannerRede({ online, pendentes, onSincronizar }: {
    online: boolean; pendentes: number; onSincronizar: () => void;
}) {
    if (online && pendentes === 0) return null;

    if (!online) {
        return (
            <View style={[bn.banner, bn.offline]}>
                <Text style={bn.icone}>📵</Text>
                <Text style={bn.texto}>Sem internet · as provas serão salvas para envio posterior</Text>
            </View>
        );
    }

    return (
        <Pressable style={[bn.banner, bn.pendente]} onPress={onSincronizar}>
            <Text style={bn.icone}>☁️</Text>
            <View style={{ flex: 1 }}>
                <Text style={bn.texto}>
                    {pendentes} prova{pendentes !== 1 ? 's' : ''} aguardando sincronização
                </Text>
                <Text style={bn.subtexto}>Toque para sincronizar agora</Text>
            </View>
            <Text style={bn.seta}>›</Text>
        </Pressable>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Scanner() {
    const insets = useSafeAreaInsets();
    const [etapa, setEtapa]               = useState<Etapa>('inicio');
    const [dadosQRAtual, setDadosQRAtual] = useState<DadosQR | null>(null);
    const [jaLeu, setJaLeu]               = useState(false);
    const [fila, setFila]                 = useState<ProvaFila[]>([]);
    const [imagemPreview, setImagemPreview] = useState<string | null>(null);
    const [progresso, setProgresso]       = useState({ atual: 0, total: 0, itemAtual: '', imagemAtual: '' });
    const [resultados, setResultados]     = useState<ResultadoProcessado[]>([]);
    const proximoId                       = useRef(1);

    // ── Estado de rede ────────────────────────────────────────────────────────
    const [online, setOnline]       = useState(true);
    const [pendentes, setPendentes] = useState(0);

    const [permCamera, pedirPermCamera] = useCameraPermissions();
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const fadeIn = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    };

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const conectado = state.isConnected === true && state.isInternetReachable !== false;
            setOnline(conectado);
        });
        atualizarContadorPendentes();
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (online) atualizarContadorPendentes();
    }, [online]);

    const atualizarContadorPendentes = async () => {
        const total = await contarPendentes();
        setPendentes(total);
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
            Alert.alert(
                'Nenhum documento detectado',
                'Tente enquadrar melhor a folha.'
            );
            setJaLeu(false);
            return;
        }

        setImagemPreview(result.scannedImages[0]);
        fadeIn();
        setEtapa('preview');
    } catch (error: any) {
        console.error('Erro ao abrir scanner:', error);

        Alert.alert(
            'Erro',
            error?.message ||
            error?.toString() ||
            JSON.stringify(error) ||
            'Falha ao abrir o scanner.'
        );

        setJaLeu(false);
    }
};

    // ── Confirmar imagem → adicionar mais ─────────────────────────────────────
    const confirmarEAdicionarMais = () => {
        if (!imagemPreview || !dadosQRAtual) return;
        setFila(prev => [...prev, {
            id: proximoId.current++,
            dadosQR: dadosQRAtual,
            imagemUri: imagemPreview,
        }]);
        setImagemPreview(null);
        setDadosQRAtual(null);
        setJaLeu(false);
        setEtapa('qrcode');
    };

    // ── Confirmar imagem → processar ou salvar offline ────────────────────────
    const confirmarEProsseguir = () => {
        if (!imagemPreview || !dadosQRAtual) return;
        const filaFinal: ProvaFila[] = [...fila, {
            id: proximoId.current++,
            dadosQR: dadosQRAtual,
            imagemUri: imagemPreview,
        }];
        setFila(filaFinal);
        setImagemPreview(null);
        setDadosQRAtual(null);

        if (online) {
            enviarTodas(filaFinal);
        } else {
            salvarOffline(filaFinal);
        }
    };

    // ── Salvar offline no SQLite ──────────────────────────────────────────────
    const salvarOffline = async (filaParaSalvar: ProvaFila[]) => {
        try {
            // Copia imagens do cache para diretório permanente antes de salvar
            const registros: ProvaSync[] = await Promise.all(
                filaParaSalvar.map(async p => ({
                    id_prova:     Number(p.dadosQR.id ?? p.dadosQR.raw),
                    qr_code:      p.dadosQR.raw,
                    arq_prova:    await copiarImagemParaPermanente(p.imagemUri),
                    data_sync:    new Date().toISOString(),
                    sincronizado: 0,
                }))
            );
            await salvaGabarito(registros);
            await atualizarContadorPendentes();
            Alert.alert(
                'Salvo offline',
                `${filaParaSalvar.length} prova${filaParaSalvar.length !== 1 ? 's' : ''} salva${filaParaSalvar.length !== 1 ? 's' : ''}. Serão enviadas quando a internet voltar.`,
                [{ text: 'OK', onPress: reiniciar }]
            );
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar as provas localmente.');
        }
    };

    // ── Sincronizar pendentes ─────────────────────────────────────────────────
    const sincronizarPendentes = async () => {
        const lista = await obterPendentes();
        if (lista.length === 0) return;

        setEtapa('sincronizando');
        setProgresso({ atual: 0, total: lista.length, itemAtual: '', imagemAtual: '' });

        const novosResultados: ResultadoProcessado[] = [];

        for (const prova of lista) {
            const label = parsearQR(prova.qr_code).titulo ?? prova.qr_code;
            setProgresso(prev => ({ ...prev, itemAtual: label, imagemAtual: prova.arq_prova }));
            try {
                const retorno = await enviarUmaProva(prova.arq_prova, String(prova.id_prova));
                if (retorno.sucesso && prova.id) {
                    await marcarSincronizado(prova.id, prova.arq_prova);
                }
                novosResultados.push({ id: prova.id ?? 0, dadosQR: parsearQR(prova.qr_code), retorno });
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Erro desconhecido';
                novosResultados.push({ id: prova.id ?? 0, dadosQR: parsearQR(prova.qr_code), retorno: { sucesso: false, mensagem: msg } });
            }
            setProgresso(prev => ({ ...prev, atual: prev.atual + 1, itemAtual: '', imagemAtual: '' }));
        }

        await atualizarContadorPendentes();
        setResultados(novosResultados);
        fadeIn();
        setEtapa('sucesso');
    };

    // ── Enviar fila sequencialmente ───────────────────────────────────────────
    const enviarTodas = async (filaParaEnviar: ProvaFila[]) => {
        setEtapa('enviando');
        setProgresso({ atual: 0, total: filaParaEnviar.length, itemAtual: '', imagemAtual: '' });

        const novosResultados: ResultadoProcessado[] = [];

        for (const prova of filaParaEnviar) {
            const label = prova.dadosQR.titulo ?? prova.dadosQR.raw;
            setProgresso(prev => ({ ...prev, itemAtual: label, imagemAtual: prova.imagemUri }));
            try {
                const retorno = await enviarUmaProva(prova.imagemUri, prova.dadosQR.id ?? prova.dadosQR.raw);
                novosResultados.push({ id: prova.id, dadosQR: prova.dadosQR, retorno });
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Erro desconhecido';
                novosResultados.push({ id: prova.id, dadosQR: prova.dadosQR, retorno: { sucesso: false, mensagem: msg } as RespostaAPI });
            }
            setProgresso(prev => ({ ...prev, atual: prev.atual + 1, itemAtual: '', imagemAtual: '' }));
        }

        setResultados(novosResultados);
        fadeIn();
        setEtapa('sucesso');
    };

    const enviarFilaAtual = () => {
        if (fila.length === 0) return;
        if (online) enviarTodas(fila);
        else salvarOffline(fila);
    };

    const refazer = () => { if (dadosQRAtual) abrirScanner(dadosQRAtual); };

    const removerDaFila = (id: number) => setFila(prev => prev.filter(p => p.id !== id));

    const reiniciar = () => {
        setEtapa('inicio');
        setDadosQRAtual(null);
        setJaLeu(false);
        setFila([]);
        setImagemPreview(null);
        setProgresso({ atual: 0, total: 0, itemAtual: '', imagemAtual: '' });
        setResultados([]);
        proximoId.current = 1;
    };

    // ─── Permissão de câmera ──────────────────────────────────────────────────
    if (!permCamera) {
        return <View style={[s.centro, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={COR_PRIMARIA} /></View>;
    }

    if (!permCamera.granted) {
        return (
            <View style={[s.centro, { paddingTop: insets.top }]}>
                <BottomNav />
                <Text style={s.textoInfo}>Precisamos da permissão da câmera</Text>
                <Pressable style={[s.botao, { marginTop: 20 }]} onPress={pedirPermCamera}>
                    <Text style={s.botaoTexto}>Conceder permissão</Text>
                </Pressable>
            </View>
        );
    }

    // ─── Tela: Início ─────────────────────────────────────────────────────────
    if (etapa === 'inicio') {
        return (
            <View style={s.tela}>
                <BottomNav />
                <BannerRede online={online} pendentes={pendentes} onSincronizar={sincronizarPendentes} />
                <View style={si.container}>
                    <View style={si.icone}>
                        <Text style={si.iconeTexto}>📋</Text>
                    </View>
                    <Text style={si.titulo}>Leitor de Gabarito</Text>
                    <Text style={si.subtitulo}>
                        Escaneie provas para processamento automático
                    </Text>

                    {/* Botão: Escanear agora */}
                    <Pressable style={si.botao} onPress={() => setEtapa('qrcode')}>
                        <Text style={si.botaoIcone}>📷</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={si.botaoTexto}>Escanear agora</Text>
                            <Text style={si.botaoSub}>Leia o QR e escaneie as provas</Text>
                        </View>
                        <Text style={si.botaoSeta}>›</Text>
                    </Pressable>

                    {/* Botão: Sincronizar — só aparece com pendentes */}
                    {pendentes > 0 && (
                        <Pressable
                            style={[si.botao, si.botaoSinc, !online && si.botaoSincDisabled]}
                            onPress={online ? sincronizarPendentes : undefined}
                        >
                            <Text style={si.botaoIcone}>☁️</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[si.botaoTexto, si.botaoSincTexto]}>
                                    Sincronizar ({pendentes})
                                </Text>
                                <Text style={[si.botaoSub, si.botaoSincSub]}>
                                    {online ? 'Enviar provas salvas offline' : 'Sem internet · aguardando conexão'}
                                </Text>
                            </View>
                            {online
                                ? <Text style={[si.botaoSeta, { color: COR_AVISO }]}>›</Text>
                                : <Text style={si.badgeOffline}>offline</Text>
                            }
                        </Pressable>
                    )}
                </View>
            </View>
        );
    }

    // ─── Tela: QR Code ────────────────────────────────────────────────────────
    if (etapa === 'qrcode') {
        return (
            <View style={s.tela}>
                <BottomNav />
                <BannerRede online={online} pendentes={pendentes} onSincronizar={sincronizarPendentes} />
                <View style={[s.cabecalho, { paddingTop: insets.top + 12 }]}>
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
                        <Pressable
                            style={[s.botaoEnviarFila, !online && s.botaoOffline]}
                            onPress={enviarFilaAtual}
                        >
                            <Text style={s.botaoEnviarFilaTexto}>
                                {online
                                    ? `Enviar ${fila.length} prova${fila.length !== 1 ? 's' : ''}  ✓`
                                    : `💾  Salvar ${fila.length} prova${fila.length !== 1 ? 's' : ''} offline`}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    }

    // ─── Tela: Preview ────────────────────────────────────────────────────────
    if (etapa === 'preview' && imagemPreview) {
        const totalNaFila = fila.length + 1;
        return (
            <Animated.View style={[s.tela, { opacity: fadeAnim }]}>
                <BottomNav />
                <BannerRede online={online} pendentes={pendentes} onSincronizar={sincronizarPendentes} />
                <View style={[s.cabecalho, { paddingTop: insets.top + 12 }]}>
                    <Text style={s.titulo}>Prova {totalNaFila}</Text>
                    <Text style={s.subtitulo}>🔗 {dadosQRAtual?.titulo ?? dadosQRAtual?.raw ?? ''}</Text>
                </View>
                <Image source={{ uri: imagemPreview }} style={s.preview} resizeMode="contain" />
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
                    <Pressable style={[s.botao, s.botaoPerigo, s.botaoIcone]} onPress={refazer}>
                        <Text style={s.botaoTexto}>↩</Text>
                    </Pressable>
                    <Pressable style={[s.botao, s.botaoSecundario]} onPress={confirmarEAdicionarMais}>
                        <Text style={s.botaoTextoSecundario}>+ Adicionar prova</Text>
                    </Pressable>
                    <Pressable
                        style={[s.botao, !online && s.botaoOffline]}
                        onPress={confirmarEProsseguir}
                    >
                        <Text style={s.botaoTexto}>
                            {online ? `Enviar ${totalNaFila}  ✓` : `💾  Salvar offline`}
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        );
    }

    // ─── Tela: Enviando / Sincronizando ───────────────────────────────────────
    if (etapa === 'enviando' || etapa === 'sincronizando') {
        const pct      = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;
        const isSinc   = etapa === 'sincronizando';
        const pendItem = progresso.total - progresso.atual - (progresso.itemAtual ? 1 : 0);

        return (
            <View style={s.tela}>
                <BottomNav />
                <View style={[s.cabecalho, { paddingTop: insets.top + 35 }]}>
                    <Text style={s.titulo}>{isSinc ? 'Sincronizando' : 'Processando'}</Text>
                    <Text style={s.subtitulo}>
                        {progresso.atual} de {progresso.total} prova{progresso.total !== 1 ? 's' : ''} concluída{progresso.total !== 1 ? 's' : ''}
                    </Text>
                </View>

                {/* Barra fina de progresso */}
                <View style={sp.barraFundo}>
                    <View style={[sp.barraPreenchimento, { width: `${pct}%` as any }]} />
                </View>

                <ScrollView contentContainerStyle={sp.lista} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: progresso.total }).map((_, i) => {
                        const numProva = i + 1;
                        const isConcluida = i < progresso.atual;
                        const isAtiva     = i === progresso.atual && progresso.itemAtual !== '';
                        const isPendente  = !isConcluida && !isAtiva;

                        if (isConcluida) return (
                            <View key={`prova-${i}`} style={[sp.card, sp.cardFeito]}>
                                <View style={[sp.dot, sp.dotFeito]} />
                                <Text style={sp.textoFeito}>Prova {numProva}</Text>
                                <Text style={sp.check}>✓</Text>
                            </View>
                        );

                        if (isAtiva) return (
                            <View key={`prova-${i}`} style={[sp.card, sp.cardAtivo]}>
                                {progresso.imagemAtual ? (
                                    <Image
                                        source={{ uri: progresso.imagemAtual }}
                                        style={sp.thumb}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <ActivityIndicator size="small" color={COR_PRIMARIA} style={{ width: 56 }} />
                                )}
                                <View style={{ flex: 1 }}>
                                    <View style={sp.ativoTopo}>
                                        <ActivityIndicator size="small" color={COR_PRIMARIA} />
                                        <Text style={sp.textoAtivo}>Prova {numProva}</Text>
                                    </View>
                                    <Text style={sp.subAtivo} numberOfLines={1}>
                                        🔗 {progresso.itemAtual}
                                    </Text>
                                </View>
                            </View>
                        );

                        return (
                            <View key={`prova-${i}`} style={[sp.card, sp.cardPendente]}>
                                <View style={[sp.dot, sp.dotPendente]} />
                                <Text style={sp.textoPendente}>Prova {numProva}</Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    }

    // ─── Tela: Sucesso ────────────────────────────────────────────────────────
    if (etapa === 'sucesso') {
        const sucessos = resultados.filter(r => r.retorno.sucesso).length;
        const falhas   = resultados.length - sucessos;
        return (
            <Animated.View style={[s.tela, { opacity: fadeAnim }]}>
                <BottomNav />
                <BannerRede online={online} pendentes={pendentes} onSincronizar={sincronizarPendentes} />
                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[s.badgeSucesso, falhas > 0 && s.badgeAviso]}>
                        <Text style={[s.badgeSucessoTexto, falhas > 0 && s.badgeAvisoTexto]}>
                            {falhas === 0
                                ? `✓  ${sucessos} prova${sucessos !== 1 ? 's' : ''} processada${sucessos !== 1 ? 's' : ''} com sucesso`
                                : `⚠  ${sucessos} ok · ${falhas} com erro`}
                        </Text>
                    </View>
                    {resultados.map(res => (
                        <CardResultado key={res.id} resultado={res} />
                    ))}
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
    cabecalho: { paddingHorizontal: 24, paddingBottom: 12 },
    titulo:    { fontSize: 22, fontWeight: '700', color: '#0F172A' },
    subtitulo: { fontSize: 14, color: '#64748B', marginTop: 4 },
    cameraWrapper:     { flex: 1, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
    miraOverlay:       { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 16 },
    mira:              { width: 220, height: 220, position: 'relative' },
    canto:             { position: 'absolute', width: 28, height: 28, borderColor: '#FFF' },
    tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    lendoBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(37,99,235,0.85)',
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    },
    lendoTexto:           { color: '#FFF', fontSize: 12, fontWeight: '600' },
    rodape:               { padding: 20, alignItems: 'center', gap: 12 },
    dica:                 { fontSize: 13, color: '#94A3B8' },
    botaoEnviarFila:      { backgroundColor: COR_PRIMARIA, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24 },
    botaoEnviarFilaTexto: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    preview:              { flex: 1, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, backgroundColor: '#1E293B' },
    filaScroll:           { maxHeight: 88, flexGrow: 0, marginHorizontal: 16, marginBottom: 8 },
    filaScrollContent:    { gap: 8, paddingHorizontal: 4 },
    acoes:                { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
    botao:                { flex: 1, backgroundColor: COR_PRIMARIA, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    botaoTexto:           { color: '#FFF', fontSize: 14, fontWeight: '700' },
    botaoPerigo:          { backgroundColor: COR_PERIGO },
    botaoIcone:           { flex: 0, width: 48, paddingHorizontal: 0 },
    botaoSecundario:      { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: COR_PRIMARIA },
    botaoTextoSecundario: { color: COR_PRIMARIA, fontSize: 14, fontWeight: '700' },
    botaoOffline:         { backgroundColor: COR_OFFLINE },
    scrollContent:        { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 48 },
    badgeSucesso:         { backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, alignItems: 'center' },
    badgeSucessoTexto:    { color: '#16A34A', fontSize: 13, fontWeight: '600' },
    badgeAviso:           { backgroundColor: '#FEF3C7' },
    badgeAvisoTexto:      { color: COR_AVISO },
    cardFallback:         { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
    textoInfo:            { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22 },
    progressoTexto:       { fontSize: 13, color: '#64748B', marginTop: 8 },
    barraFundo:           { width: '80%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    barraPreenchimento:   { height: 6, backgroundColor: COR_PRIMARIA, borderRadius: 3 },
});

// ─── Estilos tela início ──────────────────────────────────────────────────────
const si = StyleSheet.create({
    container:        { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 16 },
    icone:            { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    iconeTexto:       { fontSize: 36 },
    titulo:           { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
    subtitulo:        { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
    botao:            { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COR_PRIMARIA, borderRadius: 16, padding: 18, width: '100%', shadowColor: COR_PRIMARIA, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    botaoIcone:       { fontSize: 24 },
    botaoTexto:       { color: '#FFF', fontSize: 16, fontWeight: '700' },
    botaoSub:         { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
    botaoSeta:        { color: '#FFF', fontSize: 24, fontWeight: '300' },
    botaoSinc:        { backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: COR_AVISO, shadowColor: COR_AVISO },
    botaoSincDisabled:{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', shadowOpacity: 0 },
    botaoSincTexto:   { color: COR_AVISO },
    botaoSincSub:     { color: '#92400E' },
    badgeOffline:     { backgroundColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '700', color: '#64748B' },
});

// ─── Estilos tela de progresso ────────────────────────────────────────────────
const sp = StyleSheet.create({
    barraFundo:        { height: 3, backgroundColor: '#E2E8F0', overflow: 'hidden' },
    barraPreenchimento:{ height: 3, backgroundColor: COR_PRIMARIA },
    lista:             { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 10 },
    card:              { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, gap: 12 },
    // Concluído
    cardFeito:   { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
    dot:         { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    dotFeito:    { backgroundColor: '#22C55E' },
    dotPendente: { backgroundColor: '#CBD5E1' },
    textoFeito:  { flex: 1, fontSize: 14, fontWeight: '600', color: '#15803D' },
    check:       { fontSize: 16, color: '#22C55E', fontWeight: '700' },
    // Ativo
    cardAtivo:   { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: COR_PRIMARIA, shadowColor: COR_PRIMARIA, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
    textoAtivo:  { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
    subAtivo:    { fontSize: 11, color: '#3B82F6', marginTop: 2 },
    // Pendente
    cardPendente:  { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    textoPendente: { flex: 1, fontSize: 14, fontWeight: '500', color: '#94A3B8' },
    // Imagem no card ativo
    thumb:    { width: 56, height: 72, borderRadius: 8, backgroundColor: '#1E293B', flexShrink: 0 },
    ativoTopo:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
});

// ─── Estilos card resultado ───────────────────────────────────────────────────
const c = StyleSheet.create({
    card:          { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', width: '100%', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4, marginBottom: 20 },
    header:        { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#1E3A8A', gap: 14 },
    avatar:        { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarLetra:   { color: '#FFF', fontSize: 22, fontWeight: '700' },
    nome:          { color: '#FFF', fontSize: 15, fontWeight: '700', lineHeight: 20 },
    turma:         { color: '#93C5FD', fontSize: 12, marginTop: 2 },
    erroTexto:     { fontSize: 14, color: '#475569', textAlign: 'center' },
    tagQR:         { backgroundColor: '#EFF6FF', paddingVertical: 6, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
    tagQRTexto:    { fontSize: 11, color: '#2563EB', fontWeight: '500' },
    abas:          { flexDirection: 'row', backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    aba:           { flex: 1, paddingVertical: 12, alignItems: 'center' },
    abaAtiva:      { borderBottomWidth: 2, borderBottomColor: COR_PRIMARIA, backgroundColor: '#FFF' },
    abaTexto:      { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
    abaTextoAtivo: { color: COR_PRIMARIA, fontWeight: '700' },
    disciplina:    { fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'center', paddingTop: 14, paddingHorizontal: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    grade:         { padding: 16, gap: 10 },
    linha:         { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    legenda:       { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingBottom: 16, paddingTop: 4 },
    legendaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot:           { width: 8, height: 8, borderRadius: 4 },
    legendaTexto:  { fontSize: 11, color: '#64748B', fontWeight: '600' },
});

// ─── Estilos item da fila ─────────────────────────────────────────────────────
const f = StyleSheet.create({
    item:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 8, gap: 8, width: 200, borderWidth: 1, borderColor: '#E2E8F0' },
    thumb:        { width: 52, height: 68, borderRadius: 6, backgroundColor: '#1E293B' },
    info:         { flex: 1 },
    num:          { fontSize: 12, fontWeight: '700', color: '#0F172A' },
    qr:           { fontSize: 10, color: '#64748B', marginTop: 2 },
    remover:      { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
    removerTexto: { fontSize: 11, color: COR_PERIGO, fontWeight: '700' },
});

// ─── Estilos bolinhas ─────────────────────────────────────────────────────────
const q = StyleSheet.create({
    item:    { alignItems: 'center', gap: 4, width: 48 },
    num:     { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
    circulo: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    letra:   { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

// ─── Estilos banner de rede ───────────────────────────────────────────────────
const bn = StyleSheet.create({
    banner:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16 },
    offline:  { backgroundColor: '#1E293B' },
    pendente: { backgroundColor: '#FEF3C7' },
    icone:    { fontSize: 16 },
    texto:    { flex: 1, fontSize: 12, fontWeight: '600', color: '#0F172A' },
    subtexto: { fontSize: 11, color: '#64748B', marginTop: 1 },
    seta:     { fontSize: 20, color: COR_AVISO, fontWeight: '700' },
});