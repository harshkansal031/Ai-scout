async function test() {
  const url = 'https://venturebeat.com/infrastructure/railway-secures-usd100-million-to-challenge-aws-with-ai-native-cloud';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status code:', res.status);
    const text = await res.text();
    
    // Find all og:image and twitter:image tags
    const ogMatches = [...text.matchAll(/<meta[^>]*(property|name)=["'](og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/gi)];
    const contentMatches = [...text.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*(property|name)=["'](og:image|twitter:image)["']/gi)];
    
    console.log('ogMatches:', ogMatches.map(m => m[3]));
    console.log('contentMatches:', contentMatches.map(m => m[1]));
    
    // Let's print some lines containing og:image
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('og:image') || lines[i].includes('twitter:image')) {
        console.log(`Line ${i}: ${lines[i].trim()}`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
