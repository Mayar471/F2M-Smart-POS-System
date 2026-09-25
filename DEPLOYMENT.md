# f2m Smart POS - Production Build & Deployment Checklist

## Pre-Deployment Checklist

### Environment Variables
- [ ] Set `DATABASE_URL` to production SQLite path
- [ ] Set `AUTH_SECRET` to a secure random string (use `openssl rand -base64 32`)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Set `SUPABASE_URL` (if using Supabase for cloud sync)
- [ ] Set `SUPABASE_ANON_KEY` (if using Supabase for cloud sync)

### Database
- [ ] Run database migrations: `npx drizzle-kit push`
- [ ] Seed initial data (users, categories, products): `npm run db:seed`
- [ ] Verify database file permissions
- [ ] Test database connection in production environment

### Code Quality
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm run test`
- [ ] Remove any console.log statements
- [ ] Remove any development-only code

### Build
- [ ] Run production build: `npm run build`
- [ ] Verify build output for errors
- [ ] Test production build locally: `npm start`

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy
5. Note: SQLite requires using Vercel's file system or external database

### Option 2: Self-Hosted (VPS)
1. Install Node.js and npm on server
2. Clone repository
3. Install dependencies: `npm install`
4. Build application: `npm run build`
5. Configure environment variables
6. Start with PM2: `pm2 start npm --name "f2m-pos" -- start`
7. Configure nginx reverse proxy
8. Setup SSL certificate (Let's Encrypt)

### Option 3: Docker
1. Create `Dockerfile`:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
2. Build image: `docker build -t f2m-pos .`
3. Run container: `docker run -p 3000:3000 --env-file .env f2m-pos`

## Post-Deployment Checklist

### Verification
- [ ] Test login functionality
- [ ] Test POS order flow
- [ ] Test manager menu management
- [ ] Test reports generation
- [ ] Test PWA installation
- [ ] Test cloud sync (if configured)

### Monitoring
- [ ] Setup error tracking (Sentry, LogRocket, etc.)
- [ ] Setup uptime monitoring
- [ ] Configure backup for SQLite database
- [ ] Setup log rotation

### Security
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Restrict API routes with proper authentication
- [ ] Review and update CORS settings
- [ ] Implement rate limiting
- [ ] Regular security updates

### Performance
- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Implement caching strategy
- [ ] Monitor bundle size
- [ ] Test on mobile devices

## Maintenance

### Regular Tasks
- Weekly: Database backup
- Monthly: Dependency updates
- Quarterly: Security audit
- As needed: Feature updates

### Backup Strategy
- SQLite database: Copy `.db` file regularly
- Cloud sync: Verify Supabase backups
- Code: Git version control

## Troubleshooting

### Common Issues

**Build fails**
- Check Node.js version (requires v22+)
- Clear cache: `rm -rf .next node_modules`
- Reinstall dependencies: `npm install`

**Database errors**
- Verify database file path
- Check file permissions
- Run migrations again

**Authentication errors**
- Verify `AUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches domain
- Clear browser cookies

**PWA not installing**
- Verify manifest.json is accessible
- Check service worker registration
- Ensure HTTPS is enabled

## Support

For issues or questions:
- Check GitHub issues
- Review documentation
- Contact development team
