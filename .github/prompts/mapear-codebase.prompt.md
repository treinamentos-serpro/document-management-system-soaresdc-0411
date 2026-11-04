---
description: "Use when: mapear um codebase existente, documentar sua arquitetura, criar documentação técnica do repositório ou preparar onboarding."
name: mapear-codebase
argument-hint: "objetivo, escopo e caminho do documento (se houver)"
agent: agent
---

# Mapear e documentar um codebase existente

Objetivo solicitado: `${input:objetivo:mapear, documentar arquitetura ou criar onboarding}`

Escopo a analisar: `${input:escopo:repositório inteiro ou diretórios/funcionalidade específicos}`

Destino da documentação, se informado: `${input:destino:caminho do documento (opcional)}`

Investigue o codebase existente para produzir uma visão precisa e útil ao objetivo informado. Faça descoberta somente de leitura: não altere código-fonte, configuração, testes ou dependências. Se o usuário pedir documentação sem indicar destino, crie-a em `docs/` com um nome adequado ao objetivo: `codebase-map.md` para mapa, `architecture.md` para arquitetura ou `onboarding.md` para onboarding. Se o destino informado for apenas “no chat”, não crie arquivo. Antes de atualizar um documento existente, leia-o e preserve conteúdo válido não relacionado; se não for claro se o conteúdo deve ser substituído ou mesclado, pergunte.

## Investigação

- Comece pelo escopo indicado, instruções locais, README, manifests e pontos de entrada relevantes.
- Siga imports, chamadas, rotas, configuração e testes próximos para confirmar como os fluxos realmente funcionam.
- Identifique linguagens, frameworks, comandos de desenvolvimento/teste/build, módulos principais, responsabilidades e dependências entre camadas.
- Para explicar um fluxo, acompanhe-o da entrada ao resultado: por exemplo, rota/tela, validação, regra de negócio, persistência ou integração e resposta.
- Mantenha a investigação proporcional ao pedido. Não faça inventário de arquivos sem valor para a explicação.
- Não deduza funcionalidades apenas pelo nome de arquivos ou pela documentação antiga. Diferencie implementação confirmada, intenção documentada e pontos não encontrados.
- Não exponha segredos. Se encontrar credenciais em arquivos, informe apenas a localização e recomende tratar o segredo sem reproduzi-lo.

## Entrega

Adapte a resposta ao objetivo solicitado:

- **Mapa do codebase:** visão geral, módulos e responsabilidades, pontos de entrada, dependências e principais fluxos.
- **Documentação de arquitetura:** decisões e camadas confirmadas, limites entre módulos, integrações, armazenamento/configuração e fluxos relevantes.
- **Onboarding:** pré-requisitos, como instalar/configurar, executar e testar, estrutura que vale conhecer primeiro e um caminho seguro para a primeira alteração.

Quando fizer sentido, inclua:

1. Resumo da finalidade e do estado atual do sistema.
2. Mapa compacto dos diretórios e arquivos-chave, com links relativos do workspace.
3. Diagramas Mermaid apenas quando ajudarem a explicar dependências ou fluxos.
4. Comandos verificados no repositório, distinguindo requisitos de ambiente e comandos não executados.
5. Lacunas, decisões pendentes e pressupostos, sem preencher o que não foi confirmado.

Escreva em português claro, seja conciso e priorize instruções acionáveis. Use nomes e termos do próprio projeto. Não invente arquitetura idealizada nem proponha uma refatoração como se já existisse.

Se o objetivo ou o escopo ainda permitir interpretações materialmente diferentes, faça uma pergunta curta; caso contrário, prossiga com pressupostos explícitos. Ao terminar, resuma o que foi documentado e quais arquivos foram alterados.