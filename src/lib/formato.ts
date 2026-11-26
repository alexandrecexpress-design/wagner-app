export const soDigitos = (v: string) => (v || '').replace(/\D/g, '')

export const mascaras = {
  cpf: (v: string) => soDigitos(v).slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
  cep: (v: string) => soDigitos(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'),
  celular: (v: string) => {
    const d = soDigitos(v).slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }
}
export type Mascara = keyof typeof mascaras

export function cpfValido(cpf: string): boolean {
  const c = soDigitos(cpf)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += +c[i] * (10 - i)
  if ((s * 10) % 11 % 10 !== +c[9]) return false
  s = 0
  for (let i = 0; i < 10; i++) s += +c[i] * (11 - i)
  return (s * 10) % 11 % 10 === +c[10]
}

export const cpfOculto = (cpf: string) => {
  const c = soDigitos(cpf)
  return c.length === 11 ? `${c.slice(0, 3)}.***.***-${c.slice(9)}` : ''
}

const TZ = 'America/Sao_Paulo'
export const data = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
export const dataLonga = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }) : ''
export const dataHora = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
// "2026-04-12" (campo date) -> 12/04/2026, sem erro de fuso
export const dataSimples = (iso?: string | null) => {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return d && m && a ? `${d}/${m}/${a}` : iso
}
export const reais = (v?: number | null) =>
  v == null ? '' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const tamanho = (b?: number | null) =>
  !b ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`

export function idade(nascimento: string): number {
  const n = new Date(nascimento + 'T12:00:00'); const h = new Date()
  let a = h.getFullYear() - n.getFullYear()
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--
  return a
}

export const ARQUIVO_MAX = 10 * 1024 * 1024
export const ARQUIVO_TIPOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
export const arquivoAceito = (f: File) =>
  f.size <= ARQUIVO_MAX && (ARQUIVO_TIPOS.includes(f.type) || /\.(pdf|jpe?g|png|heic|heif|webp)$/i.test(f.name))

// nome seguro para o storage: sem acentos, espaços ou barras
export const nomeSeguro = (nome: string) => {
  const limpo = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_')
  return limpo.slice(-80) || 'arquivo'
}

export const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')
