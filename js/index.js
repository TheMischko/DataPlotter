
import MainPlot from "./components/Plot";
import CsvLoader from "./components/CsvLoader";
import Modal from "./components/Settings/SettingsModal";
import RightBar from "./components/RightBar";
import ZoomManager from "./components/Managers/ZoomManager";
import css from '/css/main.css';

const zoomManager = new ZoomManager();

const components = [
    {
        class:      Modal,
        selector:   '#modal-root',
        options: {
            'DOM_ID':       'settingsModal',
            'zoomManager':  zoomManager
        }
    },
    {
        class:      RightBar,
        selector:   '#right-bar',
        options:    {
            'zoomManager':  zoomManager
        }
    }
];


components.forEach(component => {
    if(document.querySelector(component.selector) !== null){
        document.querySelectorAll(component.selector).forEach(
            element => new component.class(element, component.selector, component.options)
        )
    }
});

document.addEventListener('plotMouseOver', (e) => {
    //console.log('plotMouseOver');
    //console.log(e);
});

document.addEventListener('setupFinished', (e) => {
    document.getElementById('wrapper').style.opacity = '1';
    //console.log('setupFinished');
    //console.log(e);
});
