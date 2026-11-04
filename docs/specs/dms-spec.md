# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para enviar, listar e baixar documentos armazenados no filesystem local, com metadados mantidos em memória e associados a um usuário demo.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos do usuário demo.
- Download de um documento pelo identificador.
- Exibição de nome, tamanho e data do envio na interface.
- Tratamento de estados de carregamento, sucesso e erro no frontend.
- Verificação de saúde do backend pelo endpoint existente `GET /health`.

### Fora do escopo

- Autenticação, cadastro de usuários e isolamento real entre usuários.
- Armazenamento em nuvem, banco de dados ou provedores externos.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Restrições de formato/MIME no upload.
- Persistência dos metadados após reinício do processo.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo por requisição em `POST /upload`, no campo multipart `file`. |
| RF-02 | O sistema deve rejeitar o upload sem arquivo ou com arquivo vazio, retornando erro de validação. |
| RF-03 | O sistema deve limitar cada arquivo a 10 MiB. O limite deve ser configurável pela variável `MAX_FILE_SIZE_BYTES`, cujo padrão é `10485760`. |
| RF-04 | O sistema deve gravar o conteúdo do arquivo no filesystem local em `backend/storage`, usando Multer com `diskStorage`. |
| RF-05 | O sistema deve gerar um identificador único e um nome de armazenamento interno; o nome original não deve ser usado como caminho no filesystem. |
| RF-06 | Após o envio, o sistema deve registrar em memória os metadados do documento e retornar o recurso criado. |
| RF-07 | O sistema deve atribuir o documento ao usuário demo `local-user`. O cliente não pode definir nem substituir o campo `owner`. |
| RF-08 | O sistema deve listar todos os documentos do usuário demo, ordenados do mais recente para o mais antigo. Empates devem ter ordenação determinística pelo identificador. |
| RF-09 | O sistema deve permitir baixar um documento existente pelo identificador e enviá-lo como anexo com o nome original informado no upload. |
| RF-10 | O sistema deve retornar erro `404` quando o identificador não existir ou quando o arquivo associado não estiver disponível no filesystem. |
| RF-11 | A interface deve permitir selecionar e enviar um arquivo, apresentar os documentos listados e oferecer uma ação de download por documento. |
| RF-12 | A interface deve comunicar falhas de upload, listagem e download sem apresentar caminhos locais ou detalhes internos do servidor. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem permanecer exclusivamente no filesystem local da aplicação, em `backend/storage`, por meio de Multer `diskStorage`. Não utilizar armazenamento externo. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase. Eles serão perdidos quando o processo backend for reiniciado; arquivos já gravados podem permanecer sem metadados associados. |
| RNF-03 | A aplicação deve usar configuração por variáveis de ambiente quando aplicável. `PORT` define a porta do backend e mantém `3000` como padrão; `MAX_FILE_SIZE_BYTES` define o limite de upload. |
| RNF-04 | O backend deve usar Node.js, Express e JavaScript CommonJS. Os testes backend devem usar o runner nativo `node:test`. |
| RNF-05 | O frontend deve usar React com Vite, componentes funcionais e Hooks, e comunicar-se com o backend usando `fetch`. |
| RNF-06 | O frontend deve chamar os endpoints sob o prefixo `/api`. O proxy de desenvolvimento do Vite encaminha essas chamadas ao backend e remove `/api` antes do encaminhamento. |
| RNF-07 | Erros de entrada, leitura e escrita de arquivos devem ser tratados nos limites apropriados; respostas não devem expor stack traces, caminhos locais ou dados internos. |
| RNF-08 | O MVP é de usuário único para demonstração e não oferece autenticação nem garantias de segurança ou isolamento multiusuário. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | API | Identificador único e opaco do documento, gerado pelo servidor. |
| `originalName` | string | API | Nome original fornecido pelo cliente, tratado como dado de exibição e nunca como caminho de armazenamento. |
| `size` | number | API | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | API | Data/hora do envio em UTC, formato ISO 8601. |
| `owner` | string | API | Identificador do usuário demo atribuído pelo servidor; valor inicial `local-user`. |
| `storageKey` | string | Interno | Nome/chave gerado pelo servidor para localizar o arquivo em `backend/storage`; não deve ser retornado pela API. |

Os registros de metadados ficam em memória e são indexados por `id`. A aplicação não deve aceitar do cliente valores para `id`, `uploadedAt`, `owner` ou `storageKey`.

## 6. Contratos de API

As rotas do backend são definidas sem o prefixo `/api`. O prefixo é usado pelo frontend e removido pelo proxy de desenvolvimento do Vite.

### Formato de erro

As respostas de erro da API devem usar `application/json` no seguinte formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` é estável para uso pelo frontend. `message` é uma mensagem legível em português. Detalhes internos e stack traces não devem ser incluídos.

### `POST /upload`

- Entrada: `multipart/form-data` com exatamente um arquivo no campo `file`.
- Limite: `MAX_FILE_SIZE_BYTES`, padrão de 10 MiB; não há filtro de extensão ou MIME no MVP.
- Sucesso: `201 Created`, `Content-Type: application/json`.

```json
{
  "document": {
    "id": "identificador-gerado",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-11-04T12:00:00.000Z",
    "owner": "local-user"
  }
}
```

- Erros: `400 FILE_REQUIRED` para arquivo ausente ou vazio; `413 FILE_TOO_LARGE` para arquivo acima do limite; `500 STORAGE_ERROR` para falha ao gravar ou registrar o arquivo.
- Se o registro dos metadados falhar depois que o arquivo tiver sido gravado, o backend deve tentar remover o arquivo recém-gravado para evitar órfão.

### `GET /documents`

- Entrada: sem parâmetros obrigatórios.
- Sucesso: `200 OK`, `Content-Type: application/json`; a lista pode estar vazia.

```json
{
  "documents": [
    {
      "id": "identificador-gerado",
      "originalName": "relatorio.pdf",
      "size": 12345,
      "uploadedAt": "2026-11-04T12:00:00.000Z",
      "owner": "local-user"
    }
  ]
}
```

- Ordenação: `uploadedAt` decrescente; em caso de empate, ordenação determinística por `id`.
- Erro: `500 INTERNAL_ERROR` se não for possível concluir a listagem.

### `GET /documents/:id/download`

- Entrada: identificador do documento no parâmetro `id`.
- Sucesso: `200 OK`, conteúdo binário, `Content-Type: application/octet-stream` e `Content-Disposition: attachment` com o nome original devidamente codificado.
- Erros: `404 DOCUMENT_NOT_FOUND` se o registro ou o arquivo não existir; `500 STORAGE_ERROR` para outra falha de leitura.

### Códigos de erro

| HTTP | Código | Situação |
| --- | --- | --- |
| 400 | `FILE_REQUIRED` | Campo `file` ausente ou arquivo vazio. |
| 413 | `FILE_TOO_LARGE` | Arquivo ultrapassa o limite configurado. |
| 404 | `DOCUMENT_NOT_FOUND` | Documento desconhecido ou arquivo local indisponível. |
| 500 | `STORAGE_ERROR` | Falha ao gravar ou ler conteúdo no filesystem. |
| 500 | `INTERNAL_ERROR` | Falha inesperada não classificada. |

### `GET /health`

- Mantém o endpoint existente para verificação de saúde.
- Sucesso: `200 OK`, JSON `{ "status": "ok" }`.

## 7. Decisões arquiteturais

### Backend

- `routes/`: registra endpoints, configura middleware HTTP e delega aos controllers. O middleware Multer é configurado para gravar em disco com `diskStorage`.
- `controllers/`: valida a entrada HTTP, chama serviços e converte resultados/erros em respostas HTTP.
- `services/`: aplica as regras de negócio, incluindo tamanho permitido, atribuição do owner demo e consistência do upload.
- `repositories/`: mantém metadados em memória e encapsula acesso aos arquivos no filesystem local.
- Fluxo de dependência: `routes -> controllers -> services -> repositories`. Camadas internas não dependem de Express ou de detalhes HTTP.
- O app Express permanece exportável para testes; `PORT` continua configurável e `/health` é preservado.

### Frontend

- Componentes funcionais React organizados em `components/`, `pages/` e `services/`.
- A comunicação HTTP fica em serviços reutilizáveis baseados em `fetch`, usando `/api` como prefixo.
- A interface apresenta estados de carregamento, lista vazia, sucesso e erro; não precisa manter o conteúdo do arquivo no estado da aplicação após o envio.

### Armazenamento e identidade

- Arquivos: `backend/storage`, filesystem local, Multer `diskStorage`; nome interno gerado pelo servidor.
- Metadados: memória do processo, sem banco de dados. Reiniciar o backend perde os registros e pode deixar arquivos órfãos; recuperação automática e limpeza desses arquivos não fazem parte do MVP.
- Identidade: usuário demo fixo atribuído pelo backend (`local-user`). Não há autenticação, cadastro, autorização ou isolamento entre usuários. O cliente não pode escolher o owner.

## 8. Plano de execução

Estas etapas descrevem trabalho futuro de implementação; não fazem parte da criação desta especificação.

1. Preparar configuração do backend, composição Express e estrutura das camadas, preservando `/health` e a exportação do app.
2. Implementar armazenamento local com Multer `diskStorage`, limite configurável, metadados em memória e fluxo de upload com tratamento de falha/rollback.
3. Implementar listagem ordenada dos metadados do usuário demo.
4. Implementar download por identificador, cabeçalhos de anexo e tratamento de documento/arquivo ausente.
5. Construir a interface React para upload, listagem, estados vazios/erro e download, consumindo a API pelo proxy `/api`.
6. Adicionar testes backend com `node:test` para contratos de sucesso e erro; verificar a integração frontend-backend e os fluxos principais manualmente.

## 9. Critérios de aceite

- O upload válido retorna `201` com metadados corretos e grava o conteúdo apenas em `backend/storage`.
- O upload ausente, vazio ou acima do limite retorna o status e código de erro definidos.
- A listagem retorna documentos do usuário demo na ordem especificada e uma coleção vazia quando não há registros.
- O download retorna os bytes enviados e o nome original como nome do anexo; ID ou arquivo inexistente retorna `404`.
- As respostas não expõem caminhos locais nem stack traces.
- A especificação não implica persistência após reinício, autenticação ou isolamento multiusuário.
- A aplicação preserva `GET /health`, configuração `PORT` e a exportação do app para testes.
- O frontend usa `/api`; as rotas do backend permanecem sem esse prefixo.