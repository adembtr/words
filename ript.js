// Add Text butonu
addTextBtn.onclick = function() {
    const text = prompt('Enter text:');
    if (text) {
        // Toplam karakter sınırı kontrolü
        const currentChars = allLines.join('\n').length;
        if (currentChars + text.length > 50000) {
            alert('Toplam metin karakteri 20.000 karakteri geçemez!');
            return;
        }
        allLines.push(...text.split(/\r?\n/));
        saveAllLines();
        renderTextPage();
    }
}; 