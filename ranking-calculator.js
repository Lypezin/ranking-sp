/**
 * Sistema de Ranking de Entregadores
 * Módulo de Cálculo de Pontos
 * 
 * Implementa todas as regras de pontuação conforme especificado:
 * - 10 pontos por entrega completada
 * - 50 pontos bônus para >= 90% tempo online
 * - 50 pontos bônus adicional para datas especiais (Natal/Ano Novo)
 * - 200 pontos para >= 20 entregas no dia
 * - 300 pontos para >= 30 entregas no dia
 */

/**
 * Verifica se uma data é uma data especial (Natal ou Ano Novo)
 * @param {Date} date - Data para verificar
 * @returns {boolean}
 */
function isDataEspecial(date) {
    // Usar UTC para evitar problemas de fuso horário
    // A string de data "YYYY-MM-DD" é interpretada como UTC meia-noite
    // Se usarmos getDate() local no Brasil (GMT-3), volta um dia (ex: 25 vira 24)
    const dia = date.getUTCDate();
    const mes = date.getUTCMonth() + 1; // getUTCMonth() retorna 0-11

    // Datas especiais: 24/12, 25/12, 31/12, 01/01
    return (
        (dia === 24 && mes === 12) ||
        (dia === 25 && mes === 12) ||
        (dia === 31 && mes === 12) ||
        (dia === 1 && mes === 1)
    );
}

/**
 * Converte string de duração "HH:MM:SS" para segundos
 * @param {string} duration - Duração no formato "HH:MM:SS"
 * @returns {number} - Duração em segundos
 */
function durationToSeconds(duration) {
    if (!duration || typeof duration !== 'string') return 0;

    const parts = duration.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0; // Use parseFloat to include milliseconds

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Calcula o percentual de tempo online em um turno
 * @param {string} tempoOnline - Tempo disponível absoluto (HH:MM:SS)
 * @param {string} duracaoTurno - Duração do período/turno (HH:MM:SS)
 * @returns {number} - Percentual de 0 a 100
 */
function calcularPercentualOnline(tempoOnline, duracaoTurno) {
    const segundosOnline = durationToSeconds(tempoOnline);
    const segundosTurno = durationToSeconds(duracaoTurno);

    if (segundosTurno === 0) return 0;

    return (segundosOnline / segundosTurno) * 100;
}

/**
 * Calcula os pontos de um único turno
 * @param {Object} turno - Dados do turno
 * @returns {Object} - Objeto com todos os pontos calculados
 */
function calcularPontosTurno(turno) {
    const percentualOnline = calcularPercentualOnline(
        turno.tempo_disponivel_absoluto,
        turno.duracao_do_periodo
    );

    const isOnline90Plus = percentualOnline >= 90;
    const dataEspecial = isDataEspecial(new Date(turno.data_do_periodo));

    // 1. Pontos por entregas (10 pontos cada)
    const pontosEntregas = (turno.numero_de_corridas_completadas || 0) * 10;

    // 2. Bônus 90% online (50 pontos)
    const bonus90Online = isOnline90Plus ? 50 : 0;

    // 3. Bônus data especial (50 pontos se >= 90% online E data especial)
    const bonusDataEspecial = (isOnline90Plus && dataEspecial) ? 50 : 0;

    // Total do turno (sem contar meta diária ainda)
    const totalPontosTurno = pontosEntregas + bonus90Online + bonusDataEspecial;

    return {
        percentual_tempo_online: parseFloat(percentualOnline.toFixed(2)),
        pontos_entregas: pontosEntregas,
        bonus_90_online: bonus90Online,
        bonus_data_especial: bonusDataEspecial,
        total_pontos_turno: totalPontosTurno
    };
}

/**
 * Agrupa turnos por data e entregador
 * @param {Array} turnos - Array de todos os turnos
 * @returns {Object} - Mapa de chave "id_entregador|data" -> array de turnos
 */
function agruparPorDiaEntregador(turnos) {
    const grupos = {};

    turnos.forEach(turno => {
        const data = turno.data_do_periodo.split('T')[0]; // Normalizar data
        const chave = `${turno.id_da_pessoa_entregadora}|${data}`;

        if (!grupos[chave]) {
            grupos[chave] = [];
        }
        grupos[chave].push(turno);
    });

    return grupos;
}

/**
 * Calcula o total de entregas de um entregador em um dia específico
 * @param {Array} turnosDoDia - Todos os turnos do entregador naquele dia
 * @returns {number} - Total de entregas no dia
 */
function calcularEntregasNoDia(turnosDoDia) {
    return turnosDoDia.reduce((total, turno) => {
        return total + (turno.numero_de_corridas_completadas || 0);
    }, 0);
}

/**
 * Calcula bônus da meta diária (200 ou 300 pontos)
 * @param {number} entregasNoDia - Total de entregas no dia
 * @returns {number} - Pontos do bônus (0, 200 ou 300)
 */
function calcularBonusMetaDiaria(entregasNoDia) {
    if (entregasNoDia >= 30) {
        return 300;
    } else if (entregasNoDia >= 20) {
        return 200;
    }
    return 0;
}

/**
 * Processa todos os turnos e calcula pontos completos
 * Inclui lógica para evitar duplicação de bônus diário
 * @param {Array} turnos - Array de todos os turnos importados do Excel
 * @returns {Array} - Array de turnos com todos os pontos calculados
 */
function processarTodosOsTurnos(turnos) {
    // Passo 1: Calcular pontos individuais de cada turno
    const turnosComPontos = turnos.map(turno => {
        const pontos = calcularPontosTurno(turno);
        return {
            ...turno,
            ...pontos
        };
    });

    // Passo 2: Agrupar por dia e entregador para calcular meta diária
    const gruposPorDia = agruparPorDiaEntregador(turnosComPontos);

    // Passo 3: Calcular entregas totais por dia e aplicar bônus apenas uma vez
    const turnosFinais = turnosComPontos.map((turno, index) => {
        const data = turno.data_do_periodo.split('T')[0];
        const chave = `${turno.id_da_pessoa_entregadora}|${data}`;
        const turnosDoDia = gruposPorDia[chave];

        // Calcular total de entregas no dia
        const entregasNoDia = calcularEntregasNoDia(turnosDoDia);

        // Verificar se este é o primeiro turno do dia para este entregador
        // (para evitar duplicação do bônus)
        const primeiroTurnoDoDia = turnosDoDia[0] === turno;

        // Calcular bônus da meta diária
        const bonusMetaDiaria = primeiroTurnoDoDia
            ? calcularBonusMetaDiaria(entregasNoDia)
            : 0;

        // Total final incluindo meta diária
        const totalPontosFinal = turno.total_pontos_turno + bonusMetaDiaria;

        return {
            ...turno,
            entregas_no_dia: entregasNoDia,
            bonus_meta_diaria: bonusMetaDiaria,
            total_pontos_final: totalPontosFinal
        };
    });

    return turnosFinais;
}

/**
 * Calcula ranking agregado por entregador
 * @param {Array} turnos - Array de turnos já processados
 * @returns {Array} - Array de entregadores com pontos totais, ordenado por pontos
 */
function calcularRanking(turnos) {
    const entregadores = {};

    // Agrupar por entregador
    turnos.forEach(turno => {
        const id = turno.id_da_pessoa_entregadora;

        if (!entregadores[id]) {
            entregadores[id] = {
                id_da_pessoa_entregadora: id,
                pessoa_entregadora: turno.pessoa_entregadora,
                total_pontos: 0,
                total_entregas: 0,
                total_turnos: 0,
                _soma_percentual_online: 0 // Campo interno, não será enviado ao banco
            };
        }

        entregadores[id].total_pontos += turno.total_pontos_final || 0;
        entregadores[id].total_entregas += turno.numero_de_corridas_completadas || 0;
        entregadores[id].total_turnos += 1;
        entregadores[id]._soma_percentual_online += turno.percentual_tempo_online || 0;
    });

    // Calcular média e converter para array (removendo campo interno)
    const ranking = Object.values(entregadores).map(entregador => ({
        id_da_pessoa_entregadora: entregador.id_da_pessoa_entregadora,
        pessoa_entregadora: entregador.pessoa_entregadora,
        total_pontos: entregador.total_pontos,
        total_entregas: entregador.total_entregas,
        total_turnos: entregador.total_turnos,
        media_percentual_online: parseFloat(
            (entregador._soma_percentual_online / entregador.total_turnos).toFixed(2)
        )
    }));

    // Ordenar por pontos (decrescente)
    ranking.sort((a, b) => b.total_pontos - a.total_pontos);

    return ranking;
}

// Exportar funções para uso em outros módulos
export {
    isDataEspecial,
    durationToSeconds,
    calcularPercentualOnline,
    calcularPontosTurno,
    calcularEntregasNoDia,
    calcularBonusMetaDiaria,
    processarTodosOsTurnos,
    calcularRanking
};
