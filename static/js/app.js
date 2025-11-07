// ============================================
// AI Digital Twin - Frontend Logic
// ============================================

const $ = (q) => document.querySelector(q);

// ============================================
// Neural Network Background Animation
// ============================================

const canvas = $('#neural-network');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  initNodes();
});

class Node {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(96, 165, 250, 0.8)';
    ctx.fill();
  }
}

let nodes = [];
const nodeCount = 50;

function initNodes() {
  nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(new Node());
  }
}

function drawConnections() {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        const opacity = (1 - distance / 150) * 0.3;
        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  
  nodes.forEach(node => {
    node.update();
    node.draw();
  });
  
  drawConnections();
  requestAnimationFrame(animate);
}

initNodes();
animate();

// ============================================
// API Interactions
// ============================================

async function refreshItems() {
  try {
    const res = await fetch('/api/memory/search?k=20');
    const data = await res.json();
    if (!data.ok) return;
    
    const itemsDiv = $('#items');
    itemsDiv.innerHTML = '';
    
    if (data.results && data.results.length > 0) {
      data.results.forEach(it => {
        const d = document.createElement('div');
        d.className = 'item';
        
        const icons = {
          message: '💬',
          note: '📋',
          task: '✅',
          preference: '⚙️'
        };
        
        d.textContent = `${icons[it.kind] || '📄'} ${it.content}`;
        itemsDiv.appendChild(d);
      });
    } else {
      itemsDiv.innerHTML = '<div class="item">No items yet. Start adding memories!</div>';
    }
  } catch (error) {
    console.error('Error refreshing items:', error);
  }
}

// Text Ingestion
$('#btn-ingest').onclick = async () => {
  const kind = $('#ingest-kind').value;
  const content = $('#ingest-content').value.trim();
  
  if (!content) {
    showNotification('Please enter some content', 'error');
    return;
  }
  
  try {
    const res = await fetch('/api/ingest/text', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({kind, content})
    });
    const data = await res.json();
    
    if (data.ok) {
      $('#ingest-content').value = '';
      showNotification('Memory saved successfully!', 'success');
      refreshItems();
    } else {
      showNotification(data.error || 'Failed to ingest', 'error');
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
};

// Preferences
$('#btn-prefs').onclick = async () => {
  const tone = $('#pref-tone').value;
  const encouraging = $('#pref-enc').checked;
  const domain = $('#pref-domain').value.trim();
  
  try {
    const res = await fetch('/api/preferences', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({tone, encouraging, domain})
    });
    const data = await res.json();
    
    const status = $('#pref-status');
    if (data.ok) {
      status.textContent = '✓ Preferences saved successfully';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 3000);
    } else {
      status.textContent = '✗ Failed to save preferences';
      status.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      status.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      status.style.color = '#f87171';
    }
  } catch (error) {
    showNotification('Network error', 'error');
  }
};

// Chat
$('#btn-chat').onclick = async () => {
  const prompt = $('#chat-prompt').value.trim();
  if (!prompt) return;
  
  const replyDiv = $('#chat-reply');
  replyDiv.textContent = '🤔 Thinking...';
  
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({prompt})
    });
    const data = await res.json();
    
    if (data.ok) {
      let output = `🤖 ${data.reply}\n\n`;
      if (data.context && data.context.length > 0) {
        output += `📚 Context used:\n${data.context.map(c => `  • ${c}`).join('\n')}`;
      }
      replyDiv.textContent = output;
    } else {
      replyDiv.textContent = `❌ Error: ${data.error || 'Unknown error'}`;
    }
  } catch (error) {
    replyDiv.textContent = '❌ Network error';
  }
};

// Memory search
$('#btn-search').onclick = async () => {
  const q = $('#search-q').value.trim();
  if (!q) return;
  
  try {
    const res = await fetch('/api/memory/search?q=' + encodeURIComponent(q) + '&k=10');
    const data = await res.json();
    
    const ul = $('#search-results');
    ul.innerHTML = '';
    
    if (data.results && data.results.length > 0) {
      data.results.forEach(r => {
        const li = document.createElement('li');
        const score = (r.score || 0).toFixed(3);
        const icons = {
          message: '💬',
          note: '📋',
          task: '✅',
          preference: '⚙️'
        };
        li.textContent = `${score} — ${icons[r.kind] || '📄'} ${r.content}`;
        ul.appendChild(li);
      });
    } else {
      ul.innerHTML = '<li>No results found</li>';
    }
  } catch (error) {
    showNotification('Search failed', 'error');
  }
};

// Add Enter key support for search
$('#search-q').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    $('#btn-search').click();
  }
});

// ============================================
// Voice Recording
// ============================================

let mediaRecorder, chunks = [];

$('#btn-record').onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.start();
    chunks = [];
    
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      $('#preview').src = URL.createObjectURL(blob);
      $('#preview').style.display = 'block';
      
      const fd = new FormData();
      fd.append('file', blob, 'recording.webm');
      
      const res = await fetch('/api/ingest/voice', { method: 'POST', body: fd });
      const data = await res.json();
      
      const status = $('#voice-status');
      if (data.ok) {
        status.textContent = `✓ Uploaded: ${data.file}`;
        status.style.display = 'block';
      } else {
        status.textContent = `✗ ${data.error || 'Upload failed'}`;
        status.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      }
    };
    
    $('#btn-record').disabled = true;
    $('#btn-stop').disabled = false;
    showNotification('Recording...', 'info');
  } catch (error) {
    showNotification('Microphone access denied', 'error');
  }
};

$('#btn-stop').onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  $('#btn-record').disabled = false;
  $('#btn-stop').disabled = true;
};

// Voice file upload
$('#btn-upload').onclick = async () => {
  const f = $('#voice-file').files[0];
  if (!f) {
    showNotification('Please select a file', 'error');
    return;
  }
  
  const fd = new FormData();
  fd.append('file', f, f.name);
  
  try {
    const res = await fetch('/api/ingest/voice', { method: 'POST', body: fd });
    const data = await res.json();
    
    const status = $('#voice-status');
    if (data.ok) {
      status.textContent = `✓ Uploaded: ${data.file}`;
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 3000);
    } else {
      status.textContent = `✗ ${data.error || 'Upload failed'}`;
    }
  } catch (error) {
    showNotification('Upload failed', 'error');
  }
};

// ============================================
// Notifications
// ============================================

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                 type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                 'rgba(59, 130, 246, 0.9)'};
    color: white;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: slideInRight 0.3s ease;
    font-weight: 500;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);



refreshItems();

console.log('%c🤖 Digital Twin AI Initialized', 'color: #60a5fa; font-size: 16px; font-weight: bold;');