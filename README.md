# 🏆 Sistema de Ranking de Entregadores

Sistema web mobile-first para visualização e gestão de ranking de entregadores baseado em sistema de pontos. Inclui upload de planilhas Excel com cálculo automático de pontuação.

## ✨ Funcionalidades

- 📱 **Mobile-First**: Interface otimizada para celular
- 🎨 **Design Moderno**: Tema em tons de azul e branco
- 📊 **Ranking Dinâmico**: Visualização em tempo real ordenada por pontos
- 🔍 **Busca**: Campo de pesquisa para encontrar entregadores
- 📤 **Upload Excel**: Importação de dados via arquivo .xlsx/.xls
- 🧮 **Cálculo Automático**: Pontos calculados automaticamente seguindo regras da promoção
- 💾 **Supabase**: Backend serverless com PostgreSQL

## 📋 Regras de Pontuação

### Pontos por Turno
- **10 pontos** por cada entrega completada
- **+50 pontos** se ficar online ≥ 90% do turno
- **+50 pontos** adicionais se ≥ 90% online em datas especiais (24-25/Dez, 31/Dez, 1/Jan)

### Metas Diárias (sem duplicação)
- **+200 pontos** ao completar ≥ 20 entregas no dia
- **+300 pontos** ao completar ≥ 30 entregas no dia

## 🚀 Configuração do Projeto

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta/faça login
3. Crie um novo projeto
4. Anote as credenciais:
   - `Project URL`
   - `anon/public key`
   - `service_role key` (Settings > API)

### 2. Executar Migration SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo `migration.sql` deste repositório
3. Copie e cole todo o conteúdo no editor
4. Clique em **Run** para criar as tabelas

### 3. Configurar Credenciais no Código

#### Para o Ranking (index.html)
Edite as linhas 62-63 no arquivo `index.html`:
```javascript
const SUPABASE_URL = 'sua-url-do-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-aqui';
```

#### Para o Upload (upload.html)
Edite as linhas 137-138 no arquivo `upload.html`:
```javascript
const SUPABASE_URL = 'sua-url-do-projeto.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sua-service-role-key-aqui';
```

> ⚠️ **IMPORTANTE**: A `service_role key` tem acesso total ao banco. NÃO compartilhe publicamente!

### 4. Testar Localmente

Opção 1 - Servidor Python:
```bash
python -m http.server 8000
```

Opção 2 - Servidor Node:
```bash
npx serve
```

Opção 3 - Live Server (VS Code):
- Instale a extensão "Live Server"
- Clique direito em `index.html` > "Open with Live Server"

Acesse: `http://localhost:8000`

## 📤 Fazendo Upload de Dados

1. Acesse `/upload.html`
2. Selecione ou arraste seu arquivo Excel
3. O arquivo deve conter as 19 colunas esperadas:
   - data_do_periodo
   - periodo
   - duracao_do_periodo
   - numero_minimo_de_entregadores_regulares_na_escala
   - tag
   - id_da_pessoa_entregadora
   - pessoa_entregadora
   - praca
   - sub_praca
   - origem
   - tempo_disponivel_escalado
   - tempo_disponivel_absoluto
   - numero_de_corridas_ofertadas
   - numero_de_corridas_aceitas
   - numero_de_corridas_rejeitadas
   - numero_de_corridas_completadas
   - numero_de_corridas_canceladas_pela_pessoa_entregadora
   - numero_de_pedidos_aceitos_e_concluidos
   - soma_das_taxas_das_corridas_aceitas

4. Clique em "Processar e Enviar Dados"
5. Aguarde o processamento
6. Confira o ranking em `/index.html`

## 🌐 Deploy na Vercel

### Opção 1: Via GitHub

1. Faça commit do código no GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "New Project"
4. Importe o repositório
5. Configure as variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Deploy!

### Opção 2: Via CLI

```bash
npm i -g vercel
vercel
```

Siga as instruções e configure as variáveis de ambiente quando solicitado.

> 💡 **Dica**: Para proteger a página de upload, considere adicionar autenticação ou hospedar em URL separada.

## 📁 Estrutura do Projeto

```
ranking-so/
├── index.html              # Página principal do ranking
├── upload.html             # Página de upload de Excel
├── styles.css              # Estilos (mobile-first)
├── ranking-calculator.js   # Lógica de cálculo de pontos
├── supabase-client.js      # Cliente Supabase
├── migration.sql           # Schema do banco de dados
├── README.md              # Este arquivo
└── .env.example           # Template de variáveis de ambiente
```

## 🔒 Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Leitura pública do ranking (anon key)
- ✅ Escrita apenas com service_role key
- ⚠️ **Nunca** exponha a service_role key no frontend em produção
- 💡 Considere mover o upload para um endpoint serverless/backend

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Backend**: Supabase (PostgreSQL)
- **Bibliotecas**:
  - [Supabase JS](https://github.com/supabase/supabase-js) - Cliente Supabase
  - [SheetJS (xlsx)](https://sheetjs.com/) - Processamento de Excel

## 📊 Banco de Dados

### Tabelas

1. **turnos_entregadores**: Armazena dados brutos de cada turno + pontos calculados
2. **ranking_entregadores**: Ranking agregado por entregador (view materializada)

### Índices

- `idx_turnos_entregador`: Índice em `id_da_pessoa_entregadora`
- `idx_turnos_data`: Índice em `data_do_periodo`
- `idx_ranking_pontos`: Índice em `total_pontos` (ordenação)

### Funções

- `recalcular_ranking()`: Recalcula o ranking a partir dos turnos

## ❓ Troubleshooting

### Erro: "Configure as credenciais do Supabase"
→ Edite `index.html` e `upload.html` com suas credenciais reais

### Ranking não aparece
→ Verifique se você fez upload de dados
→ Abra o Console do navegador (F12) para ver erros

### Excel não processa
→ Verifique se todas as 19 colunas estão presentes
→ Confira se as datas estão no formato correto
→ Veja o Console para detalhes do erro

### Upload falha
→ Verifique se configurou a `service_role_key` corretamente
→ Confira as permissões no Supabase (RLS policies)

## 📝 Próximos Passos (Melhorias Futuras)

- [ ] Autenticação para página de upload
- [ ] Filtros por praça/sub_praca
- [ ] Gráficos de evolução temporal
- [ ] Export do ranking em PDF
- [ ] API Backend para upload seguro
- [ ] Paginação para grandes volumes
- [ ] Cache Redis para performance

## 📄 Licença

Este projeto é de uso interno. Todos os direitos reservados.

---

Desenvolvido com ❤️ para otimizar a gestão de entregadores
