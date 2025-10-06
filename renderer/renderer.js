// Renderer process JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Electron app loaded successfully!');
    
    // Get the click button
    const clickBtn = document.getElementById('clickBtn');
    
    if (clickBtn) {
        clickBtn.addEventListener('click', () => {
            // Show a simple alert
            alert('Hello from Electron! 🎉');
            
            // Change button text temporarily
            const originalText = clickBtn.textContent;
            clickBtn.textContent = 'Clicked!';
            clickBtn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            
            // Reset after 2 seconds
            setTimeout(() => {
                clickBtn.textContent = originalText;
                clickBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }, 2000);
        });
    }
    
    // Add some interactive animations
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // Stagger the card animations
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Add window title update
    document.title = 'Electron App - Ready!';
});
