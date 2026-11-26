// Termo de consentimento LGPD exibido no cadastro e em /termo.
// Ao mudar o texto, troque também TERMO_VERSAO (fica gravado no perfil de quem aceitou).
// Revise com o jurídico e preencha os dados da empresa abaixo.

export const TERMO_VERSAO = '2026-11-26'

export const EMPRESA = {
  nome: 'Wagner Regularização Imobiliária',
  cnpj: '26.250.579/0001-34',
  endereco: 'Rua Jorge Augusto, 116, Vila Centenário',
  email: 'alexandre.cexpress@gmail.com', // pedidos sobre dados pessoais (LGPD)
  whatsapp: '(11) 94200-4495'
}

export const TERMO: { titulo: string; texto: string }[] = [
  { titulo: 'Quem cuida dos seus dados',
    texto: `${EMPRESA.nome}${EMPRESA.cnpj ? `, CNPJ ${EMPRESA.cnpj}` : ''}${EMPRESA.endereco ? `, ${EMPRESA.endereco}` : ''}${EMPRESA.cnpj || EMPRESA.endereco ? ',' : ''} é a controladora dos dados pessoais tratados neste aplicativo, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).` },
  { titulo: 'Quais dados coletamos',
    texto: 'Nome completo, e-mail e WhatsApp ou telefone, informados no cadastro. Também guardamos as respostas dos questionários de orçamento e os documentos que você enviar, que podem conter dados de outras pessoas (por exemplo, herdeiros, vendedores ou vizinhos de um imóvel). Ao enviá-los, você declara ter o direito de compartilhá-los para esta finalidade.' },
  { titulo: 'Para que usamos',
    texto: 'Criar e manter sua conta; analisar seu caso e preparar o orçamento; falar com você por WhatsApp, telefone ou e-mail sobre suas solicitações; prestar os serviços jurídicos, de engenharia e de certidões que você contratar, inclusive em cartórios, prefeituras e outros órgãos públicos; e cumprir obrigações legais.' },
  { titulo: 'Base legal',
    texto: 'Tratamos seus dados com base no seu consentimento (art. 7º, I), na execução de contrato e de procedimentos anteriores a ele, a seu pedido (art. 7º, V), no cumprimento de obrigação legal (art. 7º, II) e no exercício regular de direitos (art. 7º, VI).' },
  { titulo: 'Com quem compartilhamos',
    texto: 'Somente quando necessário para o serviço: cartórios, prefeituras, órgãos públicos e profissionais parceiros envolvidos no seu caso; e fornecedores de tecnologia que hospedam o aplicativo e enviam e-mails. Não vendemos nem cedemos seus dados para publicidade.' },
  { titulo: 'Como protegemos',
    texto: 'Os dados ficam em servidor localizado em São Paulo, com acesso restrito à equipe responsável. Os documentos ficam em área privada e só são abertos por links temporários.' },
  { titulo: 'Por quanto tempo guardamos',
    texto: 'Enquanto sua conta estiver ativa e pelo tempo necessário para cumprir obrigações legais ou defender direitos. Pedidos de orçamento que não viraram contrato podem ser excluídos quando você solicitar.' },
  { titulo: 'Seus direitos',
    texto: `Você pode, a qualquer momento e sem custo, pedir: confirmação e acesso aos seus dados, correção, anonimização, bloqueio ou eliminação, portabilidade, informação sobre com quem compartilhamos e a revogação deste consentimento (art. 18 da LGPD). Basta falar com a gente pelo WhatsApp ${EMPRESA.whatsapp}${EMPRESA.email ? ` ou pelo e-mail ${EMPRESA.email}` : ''}. A revogação pode impedir a continuidade de serviços em andamento.` },
  { titulo: 'Mudanças neste termo',
    texto: 'Se este termo mudar, avisaremos pelo aplicativo. A versão que você aceitou fica registrada na sua conta.' }
]
