(function () {
    if (window.innerWidth <= 480 && !document.getElementById('pl-body-html')) {
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = `body,html{overflow-x:hidden;}`;
        styleSheet.id = 'pl-body-html';
        document.head.appendChild(styleSheet);
    }
})();