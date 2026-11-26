// Serviços, textos e perguntas do orçamento.
// Para mudar um texto ou pergunta, edite aqui e publique de novo.
// Os ids precisam bater com a lista em supabase/migrations (coluna "servico").

export type TipoPergunta = 'opcoes' | 'varias' | 'texto' | 'numero' | 'data' | 'longo'
export interface Pergunta { id: string; texto: string; tipo: TipoPergunta; opcoes?: string[]; opcional?: boolean }
export interface Servico {
  id: 'usucapiao' | 'inventario' | 'holding' | 'regularizacao' | 'certidoes'
  icone: string; area: string; nome: string; resumo: string; descricao: string
  perguntas: Pergunta[]; documentos: string[]
}

export const SERVICOS: Servico[] = [
  {
    id: 'usucapiao', icone: 'casa', area: 'Jurídico + Engenharia', nome: 'Usucapião',
    resumo: 'Torne-se dono do imóvel em que você mora ou usa há anos, mesmo sem escritura.',
    descricao: 'A usucapião reconhece a propriedade de quem tem a posse do imóvel por tempo contínuo, sem oposição e como se fosse dono. Pode ser feita no cartório (extrajudicial), em geral mais rápida, ou na Justiça. O prazo exigido varia de 2 a 15 anos, conforme o caso. Nossa engenharia faz a planta e o memorial descritivo exigidos, e o jurídico conduz o pedido até o registro.',
    perguntas: [
      { id: 'tempo', texto: 'Há quanto tempo você está no imóvel?', tipo: 'opcoes', opcoes: ['Menos de 5 anos', '5 a 10 anos', '10 a 15 anos', 'Mais de 15 anos'] },
      { id: 'tipo', texto: 'O imóvel é', tipo: 'opcoes', opcoes: ['Urbano (cidade)', 'Rural'] },
      { id: 'uso', texto: 'Como você usa o imóvel?', tipo: 'opcoes', opcoes: ['Moradia', 'Comércio', 'Plantio ou criação', 'Está vazio'] },
      { id: 'area', texto: 'Área aproximada do terreno (m²)', tipo: 'numero', opcional: true },
      { id: 'doc', texto: 'Que documento você tem do imóvel?', tipo: 'opcoes', opcoes: ['Contrato particular (de gaveta)', 'Recibo de compra', 'Cessão de direitos', 'Nenhum'] },
      { id: 'iptu', texto: 'Paga IPTU ou ITR em seu nome?', tipo: 'opcoes', opcoes: ['Sim', 'Não', 'Não sei'] },
      { id: 'disputa', texto: 'Alguém já reclamou a posse ou entrou na Justiça pelo imóvel?', tipo: 'opcoes', opcoes: ['Não', 'Sim'] },
      { id: 'local', texto: 'Cidade e estado do imóvel', tipo: 'texto' },
      { id: 'obs', texto: 'Conte com suas palavras como você chegou ao imóvel', tipo: 'longo', opcional: true }
    ],
    documentos: ['Contas de luz ou água antigas no endereço', 'Carnês de IPTU', 'Contrato ou recibo de compra, se houver', 'Fotos do imóvel e da frente da rua']
  },
  {
    id: 'inventario', icone: 'familia', area: 'Jurídico', nome: 'Inventário',
    resumo: 'Partilha dos bens de quem faleceu entre os herdeiros, no cartório ou na Justiça.',
    descricao: 'O inventário levanta os bens e dívidas deixados pela pessoa falecida e divide o patrimônio entre os herdeiros. Quando todos são maiores, capazes e estão de acordo, pode ser feito no cartório. Pedido em até 2 meses após o falecimento evita multa no ITCMD na maioria dos estados.',
    perguntas: [
      { id: 'data', texto: 'Data do falecimento', tipo: 'data' },
      { id: 'testamento', texto: 'A pessoa deixou testamento?', tipo: 'opcoes', opcoes: ['Não', 'Sim', 'Não sei'] },
      { id: 'herdeiros', texto: 'Quantos herdeiros?', tipo: 'numero' },
      { id: 'acordo', texto: 'Todos os herdeiros são maiores de idade e estão de acordo?', tipo: 'opcoes', opcoes: ['Sim', 'Não', 'Não sei'] },
      { id: 'bens', texto: 'Quais bens existem?', tipo: 'varias', opcoes: ['Imóveis', 'Veículos', 'Contas e aplicações', 'Empresa ou cotas', 'Outros'] },
      { id: 'aberto', texto: 'Já existe inventário aberto?', tipo: 'opcoes', opcoes: ['Não', 'Sim'] },
      { id: 'obs', texto: 'Algo mais que devemos saber?', tipo: 'longo', opcional: true }
    ],
    documentos: ['Certidão de óbito', 'Documentos dos herdeiros', 'Matrículas dos imóveis', 'Documentos dos veículos e extratos']
  },
  {
    id: 'holding', icone: 'predio', area: 'Jurídico', nome: 'Holding Patrimonial',
    resumo: 'Organize seus bens numa empresa da família para proteger o patrimônio e planejar a sucessão.',
    descricao: 'Na holding patrimonial, os imóveis e outros bens passam para uma empresa da família. Isso facilita a sucessão, evita um inventário longo no futuro, pode reduzir impostos sobre aluguéis e venda, e ajuda a proteger o patrimônio. Avaliamos se compensa no seu caso antes de qualquer passo.',
    perguntas: [
      { id: 'objetivo', texto: 'Qual seu principal objetivo?', tipo: 'varias', opcoes: ['Planejar a sucessão (herança)', 'Proteger o patrimônio', 'Reduzir impostos', 'Organizar a gestão dos bens'] },
      { id: 'bens', texto: 'Quais bens entrariam na holding?', tipo: 'varias', opcoes: ['Imóveis', 'Empresas ou cotas', 'Investimentos', 'Veículos', 'Outros'] },
      { id: 'quantidade', texto: 'Quantos bens, aproximadamente? (somando imóveis, empresas, veículos e outros)', tipo: 'numero' },
      { id: 'aluguel', texto: 'Os imóveis geram renda de aluguel?', tipo: 'opcoes', opcoes: ['Sim', 'Não', 'Alguns'] },
      { id: 'civil', texto: 'Estado civil', tipo: 'opcoes', opcoes: ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)'] },
      { id: 'herdeiros', texto: 'Quantos filhos ou herdeiros?', tipo: 'numero', opcional: true },
      { id: 'obs', texto: 'Algo mais que devemos saber?', tipo: 'longo', opcional: true }
    ],
    documentos: ['Matrículas dos imóveis', 'Última declaração do Imposto de Renda', 'Contrato social das empresas, se houver', 'Certidão de casamento, se casado(a)']
  },
  {
    id: 'regularizacao', icone: 'chave', area: 'Jurídico + Engenharia', nome: 'Regularização de imóvel',
    resumo: 'Escritura, registro, planta, habite-se e averbação para deixar o imóvel 100% legal.',
    descricao: 'Imóvel irregular não pode ser financiado, vendido com segurança ou dado em garantia. O jurídico resolve escritura, registro e matrícula; a engenharia faz plantas, levantamento topográfico, memorial descritivo, habite-se e averbação da construção. Analisamos a situação na prefeitura e no cartório e indicamos o caminho mais rápido.',
    perguntas: [
      { id: 'situacao', texto: 'Qual a situação do imóvel?', tipo: 'varias', opcoes: ['Não tenho escritura', 'Tenho escritura, mas não registrei', 'Construção não averbada', 'Sem habite-se ou planta aprovada', 'Medidas erradas na matrícula', 'Não sei'] },
      { id: 'tipo', texto: 'Tipo do imóvel', tipo: 'opcoes', opcoes: ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Rural'] },
      { id: 'vender', texto: 'Pretende vender ou financiar em breve?', tipo: 'opcoes', opcoes: ['Sim', 'Não'] },
      { id: 'local', texto: 'Cidade e estado do imóvel', tipo: 'texto' },
      { id: 'obs', texto: 'Descreva o problema', tipo: 'longo', opcional: true }
    ],
    documentos: ['Matrícula ou certidão do imóvel', 'Contrato de compra', 'Carnê de IPTU', 'Planta ou habite-se, se houver']
  },
  {
    id: 'certidoes', icone: 'certidao', area: 'Documentação', nome: 'Certidões em geral',
    resumo: 'Casamento, nascimento, óbito, matrícula de imóvel e outras, pedidas no cartório certo por você.',
    descricao: 'Localizamos e pedimos a certidão no cartório ou órgão certo, em qualquer cidade do Brasil, e entregamos digital ou impressa. Também tiramos certidões de matrícula, ônus reais, inteiro teor e negativas de débitos e protestos para compra e venda de imóveis.',
    perguntas: [
      { id: 'tipos', texto: 'Quais certidões você precisa?', tipo: 'varias', opcoes: ['Nascimento', 'Casamento', 'Óbito', 'Matrícula do imóvel', 'Ônus reais', 'Inteiro teor', 'Negativa de débitos', 'Protesto', 'Outra'] },
      { id: 'nome', texto: 'Nome da pessoa ou número da matrícula', tipo: 'texto' },
      { id: 'local', texto: 'Cidade e estado do cartório (se souber)', tipo: 'texto', opcional: true },
      { id: 'finalidade', texto: 'Qual a finalidade da certidão?', tipo: 'opcoes', opcoes: ['Inventário', 'Usucapião', 'Regularização de imóvel', 'Compra ou venda de imóvel', 'Financiamento', 'Casamento ou divórcio', 'Processo judicial', 'Cidadania estrangeira', 'Documentação pessoal', 'Outra'] },
      { id: 'finalidade_detalhe', texto: 'Explique a finalidade (para quem ou para qual órgão você vai apresentar)', tipo: 'texto' },
      { id: 'formato', texto: 'Formato', tipo: 'opcoes', opcoes: ['Digital (PDF)', 'Impressa', 'Tanto faz'] },
      { id: 'obs', texto: 'Algum detalhe a mais?', tipo: 'longo', opcional: true }
    ],
    documentos: ['Cópia de uma certidão antiga, se tiver', 'Documento com foto da pessoa', 'Matrícula ou IPTU, para certidões de imóvel']
  }
]

export const servicoPorId = (id?: string) => SERVICOS.find(s => s.id === id)

export const WHATSAPP_NUMERO = '5511942004495'
export const WHATSAPP_TEXTO = '(11) 94200-4495'
export const linkWhatsApp = (msg: string, numero = WHATSAPP_NUMERO) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
