import { describe, expect, it } from 'vitest'
import { cpfValido, mascaras, nomeSeguro, cpfOculto, dataSimples } from '../formato'
import { validarDados, DADOS_VAZIOS, paraBanco } from '../validacao'

describe('formato', () => {
  it('valida CPF', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('111.444.777-35')).toBe(true)
    expect(cpfValido('123.456.789-00')).toBe(false)
    expect(cpfValido('111.111.111-11')).toBe(false)
  })
  it('aplica máscaras', () => {
    expect(mascaras.cpf('52998224725')).toBe('529.982.247-25')
    expect(mascaras.celular('11942004495')).toBe('(11) 94200-4495')
    expect(mascaras.celular('1133334444')).toBe('(11) 3333-4444')
    expect(mascaras.cep('04567000')).toBe('04567-000')
  })
  it('gera nome de arquivo seguro', () => {
    expect(nomeSeguro('IPTU 2026 ção/../x.pdf')).toBe('IPTU_2026_cao_.._x.pdf')
  })
  it('oculta CPF e formata data', () => {
    expect(cpfOculto('52998224725')).toBe('529.***.***-25')
    expect(dataSimples('2026-04-12')).toBe('12/04/2026')
  })
})

describe('validação do cadastro', () => {
  const ok = { ...DADOS_VAZIOS, nome: 'Maria Souza', cpf: '529.982.247-25', rg: '1', nascimento: '1980-01-01', email: 'a@b.com',
    celular: '(11) 94200-4495', cep: '04567-000', rua: 'R', numero: '1', bairro: 'B', cidade: 'C', uf: 'SP' }
  it('aceita dados completos', () => expect(validarDados(ok, true)).toEqual({}))
  it('recusa menor de idade e nome sem sobrenome', () => {
    const e = validarDados({ ...ok, nome: 'Maria', nascimento: '2015-01-01' }, true)
    expect(e.nome).toBeTruthy(); expect(e.nascimento).toMatch(/18 anos/)
  })
  it('guarda só números', () => {
    const b = paraBanco(ok)
    expect(b.cpf).toBe('52998224725'); expect(b.celular).toBe('11942004495'); expect(b.cep).toBe('04567000')
  })
})
