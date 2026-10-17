# Negativa tal

## Starta lokalt

```bash
npm install
npm run dev
```

Öppna adressen som visas i terminalen.

## Publicera med GitHub Pages

Arbetsflödet i `.github/workflows/deploy.yml` bygger och publicerar appen automatiskt när du pushar till `main` eller `master`.

1. Lägg upp projektet i ett GitHub-repository.
2. Öppna repositoryts **Settings → Pages** och välj **GitHub Actions** som källa.
3. Pusha projektet. När arbetsflödet **Deploy to GitHub Pages** har slutförts visas den delbara adressen under **Settings → Pages**.
