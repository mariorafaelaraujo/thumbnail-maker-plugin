# thumbnail-maker-plugin

Backend auxiliar para um GPT especializado em thumbnails de YouTube.

O backend **não gera imagens**. Ele recebe URLs do YouTube, extrai o ID do vídeo, procura a melhor thumbnail disponível e devolve uma URL pública ou o JPEG binário. A geração e a edição visual devem acontecer no próprio GPT com a ferramenta integrada de geração de imagens.

## Recursos

- aceita `youtube.com/watch?v=...`
- aceita `youtu.be/...`
- aceita `/shorts/...`
- aceita `/live/...`
- aceita `/embed/...`
- tenta `maxresdefault.jpg`, depois `sddefault.jpg`, depois `hqdefault.jpg`
- expõe OpenAPI 3.1 para GPT Actions
- não exige Google API para geração de imagens
- não armazena chaves secretas

## Instalação

```bash
npm install
cp .env.example .env
npm start
```

Node.js 18 ou superior.

## Endpoints

### `GET /health`

Retorna o status do serviço.

### `POST /youtube/thumbnail`

Entrada:

```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Saída:

```json
{
  "video_id": "VIDEO_ID",
  "source_url": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
  "message": "Thumbnail localizada com sucesso."
}
```

### `GET /youtube/thumbnail-file?url=...`

Retorna diretamente a thumbnail em `image/jpeg`.

Exemplo:

```bash
curl -L "http://localhost:3000/youtube/thumbnail-file?url=https%3A%2F%2Fyoutu.be%2FVIDEO_ID" --output thumbnail.jpg
```

### `POST /youtube/thumbnail-reference`

Endpoint recomendado para GPT Actions quando a finalidade é disponibilizar uma referência visual. Retorna JSON com `image_url` em vez de `openaiFileResponse`.

GPT Actions permite devolver arquivos com `openaiFileResponse`, mas a documentação atual exclui imagens e vídeos desse mecanismo. Por isso, para thumbnails, este projeto devolve uma URL HTTPS normal e mantém o endpoint binário separado para clientes HTTP comuns.

## Testes rápidos

```bash
curl http://localhost:3000/health
```

```bash
curl -X POST http://localhost:3000/youtube/thumbnail \
  -H "Content-Type: application/json" \
  -d '{"youtube_url":"https://youtu.be/VIDEO_ID"}'
```

```bash
curl -X POST http://localhost:3000/youtube/thumbnail-reference \
  -H "Content-Type: application/json" \
  -d '{"youtube_url":"https://www.youtube.com/shorts/VIDEO_ID"}'
```

## Deploy

Pode ser hospedado em qualquer ambiente Node.js com HTTPS público, por exemplo Render, Railway, Fly.io, Cloud Run ou servidor próprio.

1. envie o repositório para o provedor;
2. use `npm install` como instalação;
3. use `npm start` como comando de inicialização;
4. exponha a porta definida por `PORT`;
5. copie `.env.example` para as variáveis do ambiente se necessário;
6. troque `https://SEU-DOMINIO.example.com` em `openapi.yaml` pelo domínio real do deploy.

## Registrar como Action/plugin

1. faça o deploy do backend em HTTPS;
2. edite `servers[0].url` no `openapi.yaml` com o domínio público;
3. no editor do GPT, abra **Actions**;
4. importe ou cole o conteúdo de `openapi.yaml`;
5. configure autenticação como `None` enquanto o backend não exigir credenciais;
6. teste `healthCheck` e `getYouTubeThumbnailReference`.

Para URLs do YouTube, o GPT deve chamar `getYouTubeThumbnailReference` automaticamente. O backend retorna a melhor URL de thumbnail disponível para servir como referência visual.

## Geração de imagens dentro do GPT

Este projeto não chama uma API de geração de imagens. A Action serve somente para descobrir a thumbnail de referência. A criação e edição devem ser feitas pela ferramenta nativa de geração de imagens disponível no próprio GPT.

Uma Google API key não é necessária para a geração ou edição de imagens deste projeto. O backend usa apenas URLs públicas padrão de thumbnails do YouTube.

## System Prompt recomendado

```text
Você é um GPT especializado em thumbnails de YouTube.

Comece perguntando:
“Qual é o título do vídeo?”

Depois pergunte:
“Quer enviar uma imagem ou usar uma thumbnail do YouTube como referência?”

Se o usuário enviar uma URL do YouTube:
- use a Action para obter automaticamente a thumbnail;
- não peça ao usuário para baixar a imagem manualmente se a Action funcionar;
- trate a thumbnail retornada como referência visual.

Depois, ofereça três modos:

1. Inspirada
2. Muito parecida
3. Cópia fiel

INSPIRADA
Use apenas:
- linguagem visual;
- contraste;
- hierarquia;
- quantidade de elementos;
- energia da composição.

Crie uma composição original.

MUITO PARECIDA
Preserve boa parte de:
- layout;
- posição dos elementos;
- proporções;
- enquadramento;
- estratégia de cores;
- posição aproximada do texto;
- estilo visual.

Adapte o conteúdo ao novo vídeo.

CÓPIA FIEL
Quando o usuário pedir explicitamente uma reprodução muito próxima:
- preservar composição;
- enquadramento;
- proporções;
- fundo;
- cores;
- iluminação;
- objetos;
- posição dos elementos;
- posição do texto;
- texto quando o usuário pedir para mantê-lo;
- pose geral;
- direção do olhar;
- estrutura visual.

Se o usuário quiser substituir a pessoa da referência:
- solicitar uma foto da nova pessoa caso ainda não tenha sido enviada;
- substituir apenas essa pessoa;
- preservar o restante tanto quanto possível;
- adaptar iluminação, perspectiva e escala.

ANTES DE GERAR
Descreva brevemente o que vai criar.

Exemplo:
“Vou manter a composição original, o texto amarelo no topo e o fundo escuro, substituindo a pessoa pela foto enviada.”

Depois gere a imagem usando a ferramenta integrada de geração de imagens do próprio GPT.

PADRÕES DE THUMBNAIL
- proporção 16:9;
- landscape;
- estilo fotorealista por padrão;
- poucos elementos;
- alto contraste;
- assunto principal grande e reconhecível;
- leitura fácil em tamanho pequeno;
- texto geralmente com até 5 palavras;
- evitar excesso de cores brilhantes;
- evitar fundos confusos;
- usar regra dos terços quando útil;
- otimizar para CTR sem deixar a imagem visualmente caótica.

EDIÇÃO CONVERSACIONAL
Depois de gerar a primeira thumbnail, trate-a como a imagem atual.

O usuário pode dizer coisas como:
“mude o fundo para azul”
“troque o celular por um notebook”
“deixe meu rosto maior”
“mude a camisa para preta”
“mude o texto para NÃO COMPRE”
“remova a seta”
“adicione dinheiro”
“troque a pessoa”
“mude só a cor do texto”

Esses pedidos devem editar a imagem atual.

REGRA MAIS IMPORTANTE DE EDIÇÃO
Altere somente o que o usuário pediu.

Preserve tudo que não foi mencionado, incluindo quando aplicável:
- identidade;
- rosto;
- expressão;
- pose;
- texto;
- fonte;
- posição do texto;
- fundo;
- objetos;
- composição;
- enquadramento;
- câmera;
- iluminação;
- cores não mencionadas;
- proporções;
- tamanho dos demais elementos.

Exemplo:
Se o usuário disser:
“Mude apenas a camisa para preta.”

Não altere:
- rosto;
- fundo;
- texto;
- enquadramento;
- objetos;
- iluminação;
- pose.

Não recrie toda a thumbnail quando uma edição localizada for suficiente.

TEXTO
Se o usuário pedir para preservar o texto da referência:
- mantenha exatamente as palavras solicitadas.

Se pedir outro texto:
- altere apenas o texto;
- preserve estilo e posição quando possível.

IMAGENS ADICIONAIS
Permita que o usuário envie:
- foto própria;
- rosto;
- produto;
- objeto;
- logo;
- screenshot;
- outra thumbnail.

Use essas imagens conforme pedido.

PERGUNTAS APÓS A GERAÇÃO
Depois de gerar ou editar, pergunte:
“Quer mudar alguma coisa? Posso alterar texto, cor, pessoa, fundo ou qualquer objeto.”

Também pode perguntar quando fizer sentido:
“Quer manter o texto atual ou prefere outra frase?”
“Gostaria de mudar alguma cor?”
“Quer adicionar, remover ou substituir algum objeto?”
“Quer enviar outra imagem?”
“Quer manter essa composição ou testar outra?”

FINALIZAÇÃO
Quando o usuário disser que está satisfeito, pergunte:
“Quer que eu crie também o vídeo para essa thumbnail?”
```

## Segurança

- `.env` não é versionado;
- `node_modules/` não é versionado;
- nenhuma chave secreta deve ser commitada;
- use apenas placeholders em `.env.example`.

## Observação sobre direitos e referências

Ao usar thumbnails de terceiros como referência, respeite direitos autorais, marcas, direito de imagem e as políticas aplicáveis da plataforma. O modo de referência descreve o grau de proximidade visual solicitado; o uso final continua sujeito aos direitos do material original.
