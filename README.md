
# Multimodal Personal Digital Twin

A multimodal AI system that learns from **your messages, voice, notes, and preferences** to think, write, and plan exactly like you.  
This project includes a full-stack implementation using **Python (Flask) + HTML/CSS/JS** and integrates **Gemini 2.5 Flash** as the core LLM.

---

## 🚀 Project Overview
The Personal Digital Twin is designed to replicate:

- Your writing style  
- Your decision-making  
- Your communication tone  
- Your preferences  
- Your personal knowledge  
- Your memory  

This creates a virtual “you” capable of interacting, planning, and assisting across productivity and branding tasks.

---

## ✅ Core Features

### 1. **Textual Memory**
Store and retrieve:
- Messages  
- Notes  
- Preferences  
- Tasks  
Vectorized memory enables relevance-based recall.

### 2. **Voice Memory**
Upload or record audio.  
(Future upgrade: speaker embeddings + voice cloning.)

### 3. **Preference Engine**
Control:
- Tone (professional, friendly, concise, enthusiastic)
- Encouraging mode
- Domain (productivity, branding, tech, etc.)

### 4. **Chat with Your Twin**
Gemini 2.5 Flash uses:
- Your prompt  
- Your memory  
- Your preferences  
To respond **exactly like you**.

### 5. **Memory Search**
Search your stored messages, notes, and tasks using semantic similarity.

---

## ✅ Technology Stack

### Backend
- **Python**
- **Flask**
- **Gemini 2.5 Flash API (REST)**
- Local vector memory storage (JSON)
- Voice storage

### Frontend
- **HTML**
- **CSS**
- **JavaScript**
- Live chat interface
- Voice controls
- Memory viewer
- Preferences panel

---

## ✅ File Structure

```
project/
│── app.py
│── README.md
│── requirements.txt
│── providers/
│   └── llm_provider.py
│── templates/
│   └── index.html
│── static/
│   ├── css/styles.css
│   └── js/app.js
│── data/
│   ├── memory.json
│   └── preferences.json
└── voice_samples/
```

---

## ✅ Setup Instructions

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Add your Gemini API key
Create `.env` file:
```
GOOGLE_API_KEY=your_api_key_here
```

### 3. Run the app
```bash
python app.py
```

Open your browser:
```
http://127.0.0.1:5000
```

---

## ✅ Future Upgrades

- Gemini embeddings + FAISS vector DB  
- Voice embedding & voice cloning  
- Specific personality profiles  
- Content generation agent  
- React frontend  
- Mobile app version  

---

## ✅ License
MIT License — free to use, modify, and expand.

