import os
import requests

# Load your Gemini API key
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

# ✅ Use the correct Gemini 2.5 Flash model endpoint
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)

def generate_reply(prompt: str, retrieved_snippets, prefs):
    """
    Generates a personalized response using Gemini 2.5 Flash.
    This is the main engine of your digital twin.
    """

    if not GEMINI_API_KEY:
        return f"[Gemini API key missing] {prompt}"

    # Preferences injected into reasoning
    tone = prefs.get("tone", "professional")
    encouraging = prefs.get("encouraging", True)
    domain = prefs.get("domain", "general")

    # Convert retrieved memory into readable context
    memory_text = "\n".join(f"- {s}" for s in retrieved_snippets)

    # System instructions to shape the twin's personality
    system_prompt = (
        f"You are the user's multimodal personal digital twin.\n"
        f"Your responsibilities:\n"
        f"- Think, write, plan, and communicate exactly like the user.\n"
        f"- Follow their tone: {tone}.\n"
        f"- Work in domain: {domain}.\n"
        f"- Encouraging: {encouraging}.\n"
        f"- Blend retrieved personal memories naturally.\n"
    )

    # Gemini API request body
    payload = {
        "contents": [
            {"parts": [{"text": system_prompt}]},
            {"parts": [{"text": f"User Query:\n{prompt}"}]},
            {"parts": [{"text": f"Relevant Personal Memory:\n{memory_text}"}]}
        ]
    }

    # Send request to Gemini
    response = requests.post(
        GEMINI_URL,
        headers={"Content-Type": "application/json"},
        params={"key": GEMINI_API_KEY},
        json=payload
    )

    # Parse response
    data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return f"[Gemini Error] {data}"
