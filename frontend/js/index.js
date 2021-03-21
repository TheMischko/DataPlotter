
import MainPlot from "./components/Plot";
import CsvLoader from "./components/CsvLoader";
import Modal from "./components/Settings/SettingsModal";
import RightBar from "./components/RightBar";
import ZoomManager from "./components/Managers/ZoomManager";
import PlotManager from "./components/Managers/PlotManager";
import css from "../css/main.css"
import LeftBar from "./components/LeftBar";
const $ = require('jquery-ajax');

const zoomManager = new ZoomManager();
const plotManager = new PlotManager('plots', zoomManager);

const SERVER_URL = 'http://localhost:3000'
localStorage.setItem('SERVER_URL', SERVER_URL);

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
    },
    {
        class:      LeftBar,
        selector:   '#left-bar',
        options:    {}

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

document.addEventListener('plotMouseLeave', (e) => {
    //console.log('plotMouseLeave');
    //console.log(e);
});

document.addEventListener('setupFinished', (e) => {
    document.getElementById('wrapper').style.opacity = '1';
    //console.log('setupFinished');
    //console.log(e);
});

document.addEventListener('setupNeeded', (e) => {
   //console.log('setupNeeded');
   //console.log(e);
});
