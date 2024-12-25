const script = document.createElement('script');
script.type = 'module';
script.src = chrome.runtime.getURL('content.js');
document.head.appendChild(script); 