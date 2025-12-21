/**
 * Cliente Supabase para o Sistema de Ranking
 * 
 * IMPORTANTE: Configure as variáveis de ambiente antes de usar:
 * - VITE_SUPABASE_URL: URL do seu projeto Supabase
 * - VITE_SUPABASE_ANON_KEY: Chave pública anônima (para leitura)
 * - VITE_SUPABASE_SERVICE_ROLE_KEY: Chave de serviço (para upload/escrita)
 */

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase (será inicializado)
let supabase = null;

/**
 * Inicializa o cliente Supabase
 * @param {string} url - URL do projeto Supabase
 * @param {string} key - Chave de API (anon ou service_role)
 */
function initSupabase(url, key) {
    if (!url || !key) {
        console.error('URL e Key do Supabase são obrigatórios');
        return null;
    }

    console.log('Supabase Client v2.0 Initializing...');
    supabase = createClient(url, key);
    return supabase;
}

/**
 * Busca o ranking de entregadores
 * Se um limit for passado e for <= 1000, faz uma query simples.
 * Se limit for > 1000 ou null (buscar tudo), faz paginação automática.
 */
async function buscarRanking(limit = 1000) {
    try {
        // Se for uma busca simples pequena, usa o método padrão
        if (limit && limit <= 1000) {
            const { data, error } = await supabase
                .from('ranking_entregadores')
                .select('*')
                .order('total_pontos', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        }

        // Se precisar de mais de 1000, usamos paginação (range)
        let todosEntregadores = [];
        let from = 0;
        const batchSize = 1000;
        let buscarMais = true;
        let totalLimit = limit || 1000000; // Limite alto se null

        console.log('Iniciando busca paginada do ranking...');

        while (buscarMais && todosEntregadores.length < totalLimit) {
            const to = from + batchSize - 1;

            const { data, error } = await supabase
                .from('ranking_entregadores')
                .select('*')
                .order('total_pontos', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (data && data.length > 0) {
                todosEntregadores = todosEntregadores.concat(data);
                from += batchSize;

                // Se retornou menos que o batch, acabou
                if (data.length < batchSize) {
                    buscarMais = false;
                }
            } else {
                buscarMais = false;
            }
        }

        // Cortar se passou do limite solicitado (se não for null)
        if (limit && todosEntregadores.length > limit) {
            return todosEntregadores.slice(0, limit);
        }

        console.log(`Total de entregadores carregados: ${todosEntregadores.length}`);
        return todosEntregadores;

    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        throw error;
    }
}

/**
 * Busca entregadores por nome (pesquisa)
 * @param {string} termoPesquisa - Termo para buscar no nome
 * @param {number} limit - Número máximo de resultados
 * @returns {Promise<Array>} - Array de entregadores encontrados
 */
async function buscarEntregadoresPorNome(termoPesquisa, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('ranking_entregadores')
            .select('*')
            .ilike('pessoa_entregadora', `%${termoPesquisa}%`)
            .order('total_pontos', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Erro ao buscar entregadores:', error);
        throw error;
    }
}

/**
 * Insere múltiplos turnos no banco de dados
 * NOTA: Requer service_role_key (usar apenas no upload)
 * @param {Array} turnos - Array de turnos para inserir
 * @returns {Promise<Object>} - Resultado da inserção
 */
async function inserirTurnos(turnos) {
    try {
        const { data, error } = await supabase
            .from('turnos_entregadores')
            .insert(turnos);

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Erro ao inserir turnos:', error);
        throw error;
    }
}

/**
 * Chama a função do Supabase para recalcular o ranking
 * NOTA: Requer service_role_key
 * @returns {Promise<void>}
 */
async function recalcularRanking() {
    try {
        const { data, error } = await supabase
            .rpc('recalcular_ranking');

        if (error) throw error;

        console.log('Ranking recalculado com sucesso');
        return { success: true };
    } catch (error) {
        console.error('Erro ao recalcular ranking:', error);
        throw error;
    }
}

/**
 * Limpa todos os dados (turnos e ranking)
 * NOTA: Use com cuidado! Requer service_role_key
 * @returns {Promise<void>}
 */
async function limparTodosDados() {
    try {
        // Limpar ranking
        await supabase
            .from('ranking_entregadores')
            .delete()
            .neq('id', 0); // Delete all

        // Limpar turnos
        await supabase
            .from('turnos_entregadores')
            .delete()
            .neq('id', 0); // Delete all

        console.log('Todos os dados foram limpos');
        return { success: true };
    } catch (error) {
        console.error('Erro ao limpar dados:', error);
        throw error;
    }
}

/**
 * Processa upload completo de Excel
 * 1. Insere turnos processados
 * 2. Recalcula ranking
 * @param {Array} turnosProcessados - Turnos já com pontos calculados
 * @returns {Promise<Object>} - Resultado do upload
 */
async function uploadCompleto(turnosProcessados) {
    try {
        // Passo 0: Limpar dados antigos para evitar duplicação
        console.log('Limpando dados antigos...');
        await limparTodosDados();

        console.log(`Iniciando upload de ${turnosProcessados.length} turnos...`);

        // Passo 1: Inserir turnos em lotes
        const BATCH_SIZE = 500;
        for (let i = 0; i < turnosProcessados.length; i += BATCH_SIZE) {
            const batch = turnosProcessados.slice(i, i + BATCH_SIZE);
            await inserirTurnos(batch);
            console.log(`Processado lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(turnosProcessados.length / BATCH_SIZE)}`);
        }

        // Passo 2: Recalcular ranking
        console.log('Recalculando ranking...');
        await recalcularRanking();

        console.log('Upload completo com sucesso!');
        return {
            success: true,
            turnosInseridos: turnosProcessados.length
        };
    } catch (error) {
        console.error('Erro no upload completo:', error);
        throw error;
    }
}

/**
 * Verifica se a conexão com Supabase está funcionando
 * @returns {Promise<boolean>}
 */
async function verificarConexao() {
    try {
        const { data, error } = await supabase
            .from('ranking_entregadores')
            .select('count')
            .limit(1);

        if (error) throw error;

        console.log('Conexão com Supabase OK');
        return true;
    } catch (error) {
        console.error('Erro na conexão com Supabase:', error);
        return false;
    }
}

// Exportar funções
export const SupabaseClient = {
    initSupabase,
    buscarRanking,
    buscarEntregadoresPorNome,
    inserirTurnos,
    recalcularRanking,
    limparTodosDados,
    uploadCompleto,
    verificarConexao
};
