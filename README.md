# LegalKaki Frontend - POC Version

> AI-powered legal assistant for Malaysian SMEs and individuals

## 🎯 Quick Start

```bash
# 1. Add your Gemini API key to .env.local
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

**That's it!** No AWS setup, no authentication needed.

---

## ✨ Features

- 🤖 **AI Text Analysis** - Analyze legal documents with Gemini AI
- 🧠 **Mind Map Generation** - Visualize legal insights
- 💬 **Chat Interface** - Ask legal questions
- 📄 **Document Management** - Upload and organize PDFs
- ✅ **Action Items** - Track legal tasks
- 📊 **Collections** - Organize by legal domain

---

## 🏗️ Architecture

- **Framework:** Next.js 15.5.3 + React 19
- **AI:** Google Gemini Pro
- **Storage:** Browser localStorage
- **Auth:** Bypassed (POC mode)
- **Styling:** Tailwind CSS

---

## 📚 Documentation

- **[SUCCESS.md](SUCCESS.md)** - ✅ Build success status
- **[QUICKSTART.md](QUICKSTART.md)** - 2-minute setup guide
- **[POC_README.md](POC_README.md)** - Comprehensive POC documentation
- **[CONVERSION_COMPLETE.md](CONVERSION_COMPLETE.md)** - What changed from AWS

---

## 🔧 Configuration

### Environment Variables

```env
# Required for AI features
NEXT_PUBLIC_GEMINI_API_KEY=your_key

# POC mode (already set)
NEXT_PUBLIC_POC_MODE=true
```

Get your free Gemini API key: https://makersuite.google.com/app/apikey

---

## 🎨 Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── screens/      # Page-level components
│   ├── ui/           # Reusable UI components
│   └── layout/       # Layout components
├── api/              # API clients & services
│   ├── geminiService.ts    # Gemini AI integration
│   ├── mockData.ts         # Mock data
│   └── endpoints.ts        # API endpoints
├── lib/              # Utilities
│   ├── localStorage-utils.ts  # Data persistence
│   └── envConfig.ts           # Environment config
├── contexts/         # React Context providers
├── types/            # TypeScript types
└── constants/        # App constants
```

---

## 🚀 Scripts

```bash
# Development
npm run dev          # Start dev server (port 3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## 🧪 Testing

### Quick Test

```bash
npm run dev
# Visit http://localhost:3000
# Should auto-redirect to /domains
```

### Full Test Checklist

- [ ] Navigate to all 4 legal domains
- [ ] Create a collection
- [ ] Upload a PDF (stored in localStorage)
- [ ] Select text in PDF → See AI analysis
- [ ] Generate mind map from collection
- [ ] Create action items
- [ ] View profile

---

## 🐛 Troubleshooting

### Build Errors

```bash
npm install
npm run build
```

### "Failed to fetch" Errors

Normal in POC mode - app falls back to mock data.

### No AI Responses

1. Check `.env.local` has Gemini API key
2. Restart dev server
3. Check console for `[Gemini Service]` logs

---

## 💰 Cost

**POC Mode:** FREE
- Gemini Free Tier: 60 requests/minute
- No storage costs (localStorage)
- No auth costs (bypassed)

**Production:**
- Gemini Pro: $0.00025 per 1K characters
- Very cheap compared to AWS Bedrock

---

## 📦 Dependencies

### Core
- Next.js 15.5.3
- React 19.1.0
- TypeScript 5

### AI
- @google/generative-ai

### UI
- Tailwind CSS
- Framer Motion
- Lucide React

### Document Processing
- react-pdf
- pdfjs-dist

---

## 🔐 Security Notes

**POC Mode is NOT production-ready:**
- ⚠️ Authentication bypassed
- ⚠️ Data stored in browser only
- ⚠️ API key exposed in client

**For Production:**
1. Move Gemini API to backend
2. Implement proper authentication
3. Use secure database storage
4. Add rate limiting

---

## 🎓 Learn More

### Gemini AI
- [Gemini API Docs](https://ai.google.dev/docs)
- [Get API Key](https://makersuite.google.com/app/apikey)

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

---

## 📄 License

This project is part of the LegalKaki hackathon submission.

---

## 🤝 Contributing

This is a POC version. For production contributions, please:

1. Review `POC_CONVERSION_SUMMARY.md`
2. Check `CONVERSION_COMPLETE.md` for changes
3. Test locally with Gemini API key

---

## 📞 Support

For issues:
1. Check console logs for `[POC Mode]` or `[Gemini Service]` messages
2. Review documentation files
3. Verify `.env.local` configuration

---

**Status:** ✅ POC Ready
**Build:** ✅ Passing
**AI:** ✅ Gemini Integrated

**Made with ❤️ for Great AI Hackathon**
