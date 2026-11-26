import { describe, expect, it } from 'vitest'
import { cpfValido, mascaras, nomeSeguro, cpfOculto, dataSimples } from '../formato'
import { validarCadastro, CADASTRO_VAZIO, validarPerfil, perfilParaBanco } from '../validacao'

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
  const ok = { ...CADASTRO_VAZIO, nome: 'Maria Souza', email: 'a@b.com', celular: '(11) 94200-4495', senha: 'segredo123', senha2: 'segredo123', termo: true }
  it('aceita dados completos', () => expect(validarCadastro(ok)).toEqual({}))
  it('exige sobrenome, DDD e aceite do termo', () => {
    const e = validarCadastro({ ...ok, nome: 'Maria', celular: '94200-4495', termo: false })
    expect(e.nome).toBeTruthy(); expect(e.celular).toMatch(/DDD/); expect(e.termo).toBeTruthy()
  })
  it('perfil guarda só números no telefone', () => {
    expect(perfilParaBanco({ nome: ' Maria   Souza ', celular: '(11) 3333-4444' })).toEqual({ nome: 'Maria Souza', celular: '1133334444' })
    expect(validarPerfil({ nome: 'Maria Souza', celular: '(11) 3333-4444' })).toEqual({})
  })
})
