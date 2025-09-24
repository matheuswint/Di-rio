# Diário Pessoal Mobile App

Um app de diário pessoal feito com **React Native + Expo** e **Supabase**. Permite criar, listar, editar e deletar anotações com título, descrição e mídia (imagem ou vídeo).

---

## Tecnologias usadas

- **React Native + Expo** – para desenvolvimento mobile cross-platform.
- **Supabase** – backend completo: Auth, Database (Postgres) e Storage.
- **Expo ImagePicker** – para escolher imagens e vídeos da galeria.
- **Expo Vector Icons** – ícones bonitinhos e fáceis de usar no app.
- **TypeScript** – segurança extra com tipagem.
- **React Navigation** – navegação entre telas do app.

---

## Funcionalidades implementadas

1. **Autenticação**
   - Login, registro e logout via Supabase Auth.
2. **Notas**
   - Criar notas com título, descrição e mídia.
   - Listar todas as notas do usuário.
   - Editar notas existentes.
   - Excluir notas.
3. **Mídia**
   - Upload de imagens e vídeos para Supabase Storage.
   - Exibição das mídias nas notas.
4. **Interface**
   - Header com logout e botão de nova nota.
   - Tela de edição limpa, com preview da mídia selecionada.

---

## Como rodar o projeto

1. Clone este repositório:
   ```
   git clone https://github.com/seu-usuario/seu-repo.git
   cd seu-repo
   ```
2. Instale as dependências:
```
npm install
```
3. Rode o app no Expo:
```
expo start
```

4. Escaneie o QR code com o app Expo Go no celular ou rode em emulador.

5. Configure seu Supabase:

Crie um projeto no Supabase

Configure o bucket galeria.

Crie as tabelas profiles e entries.

Ajuste as políticas de Row Level Security.

Coloque suas chaves no supabaseClient.ts.

## Observações

A mídia só é visível para o usuário que fez upload (políticas RLS).

Para vídeos grandes, a performance pode variar dependendo do dispositivo.

Ícones do Expo Vector Icons foram usados para deixar a interface mais intuitiva.
