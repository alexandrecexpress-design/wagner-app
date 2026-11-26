const tracos: Record<string, JSX.Element> = {
  casa: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  familia: <><circle cx="8" cy="7" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M2.5 20c.6-3.6 2.8-6 5.5-6s4.9 2.4 5.5 6" /><path d="M14 20c.4-2.6 1.6-4.3 3-4.3s2.8 1.6 3.5 4.3" /></>,
  predio: <><path d="M4 21V8l8-5 8 5v13" /><path d="M2 21h20" /><path d="M9 21v-5h6v5" /><path d="M8 11h2M14 11h2" /></>,
  chave: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l2 2M15 8l2 2" /></>,
  certidao: <><path d="M14 3H5v18h7" /><path d="M14 3v4h4v4" /><path d="M8 9h4M8 13h3" /><circle cx="17" cy="16" r="3.2" /><path d="m15.5 19-1 3 2.5-1.2 2.5 1.2-1-3" /></>,
  balanca: <><path d="M12 3v18M7 21h10M5 7h14" /><path d="m5 7-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z" /></>,
  regua: <><path d="M3 17 17 3l4 4L7 21z" /><path d="m7 13 2 2M10 10l2 2M13 7l2 2" /></>,
  orcamento: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  lista: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" /></>,
  grade: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  documento: <><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></>,
  enviar: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  baixar: <><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
  painel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11" /></>,
  sino: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>
}

export function Icone({ nome, className }: { nome: string; className?: string }) {
  if (nome === 'whatsapp') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tracos[nome] ?? tracos.documento}
    </svg>
  )
}
