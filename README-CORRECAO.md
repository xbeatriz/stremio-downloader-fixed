# Correções experimentais — Stremio Downloader

Código original: https://github.com/BurningSands70/stremio-downloader

Esta cópia inclui correções preliminares em `lib/server.js` e `lib/proxy.js`:

- Porta preferida 8189; seleção automática de uma porta disponível e indicação no terminal.
- Servidor local limitado a 127.0.0.1.
- Proxy HTTPS para a página Stremio.
- Respostas binárias preservadas; evitar manipular respostas comprimidas como texto.
- Mensagens de erro do proxy para facilitar o diagnóstico.

## Executar no Windows (ambiente de desenvolvimento)

Instalar Node.js e executar na pasta do repositório:

```powershell
npm install
npm start
```

Se a porta 8189 estiver ocupada, observa o endereço real indicado no terminal.
Abre `http://127.0.0.1:PORTA/downloader/`, substituindo PORTA pelo valor apresentado.

**Estado:** correção não validada end-to-end no Windows. Electron 6 e outras dependências são antigas. A integração do Stremio e os downloads podem exigir alterações adicionais. O projeto ainda não tem um instalador atualizado.

Para criar o executável, será necessário validar primeiro as dependências e o funcionamento completo. Usa apenas conteúdos que estejas autorizado a descarregar.
