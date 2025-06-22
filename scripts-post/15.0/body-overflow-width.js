(function () {
    if (!document.getElementById('pl-body-html')) {
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = `body,html{max-width:100%;overflow-x:hidden;}`;
        styleSheet.id = 'pl-body-html';
        document.head.appendChild(styleSheet);
    }
})();
