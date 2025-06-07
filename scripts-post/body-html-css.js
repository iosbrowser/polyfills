const styleId = '%@';
let styleSheet = document.getElementById(styleId);

if (!styleSheet) {
    styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `body, html { max-width: 100%; overflow-x: hidden; }`;
    styleSheet.id = styleId;
    document.head.appendChild(styleSheet);
}
