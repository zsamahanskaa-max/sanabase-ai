# SanaBase AI: өшпейтін ссылка жасау

## Ең оңай жол: Render

1. GitHub-та жаңа repository ашыңыз.
2. Осы проект файлдарын repository-ге жүктеңіз.
3. Render.com сайтына кіріңіз.
4. New -> Web Service таңдаңыз.
5. GitHub repository-ді таңдаңыз.
6. Start command:

```text
node server.js
```

7. Environment variables ішіне қосыңыз:

```text
OPENAI_API_KEY=сіздің OpenAI API key
OPENAI_MODEL=gpt-4.1-mini
```

8. Deploy басыңыз.

Render сізге мына сияқты тұрақты ссылка береді:

```text
https://sanabase-ai.onrender.com
```

Free plan кейде ұйқыға кетеді. Нағыз өшпейтін жұмыс үшін paid Starter plan таңдаңыз.

## Ең тұрақты жол: VPS + Docker

1. VPS алыңыз: DigitalOcean, Hetzner, AWS Lightsail немесе басқа сервер.
2. Домен алыңыз: мысалы `sanabase.kz`.
3. Серверге Docker орнатыңыз.
4. Проектті серверге көшіріңіз.
5. `.env.example` файлын `.env` деп көшіріп, `OPENAI_API_KEY` қойыңыз.
6. Іске қосыңыз:

```bash
docker compose up -d --build
```

7. Доменді сервер IP-іне бағыттаңыз.
8. HTTPS үшін Cloudflare немесе Nginx Proxy Manager қолданыңыз.

Бұл вариант бизнес үшін ең дұрыс: ссылка өшпейді, сервер сіздікі болады.

## Неге мен бірден public link бере алмаймын?

Public тұрақты ссылка шығару үшін бір external hosting аккаунт керек: Render, Railway, VPS немесе GitHub. Бұл аккаунтқа кіру, repository таңдау, billing/plan таңдау сияқты әрекеттер сіздің рұқсатыңызбен жасалады.

Менің дайындап қойғаным:

- Render config: `render.yaml`
- Docker config: `Dockerfile`, `docker-compose.yml`
- Env template: `.env.example`
- App start command: `node server.js`
