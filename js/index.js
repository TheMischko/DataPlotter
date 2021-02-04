
import MainPlot from "./components/Plot";
import CsvLoader from "./components/CsvLoader";
import Modal from "./components/Settings/SettingsModal";
import css from '/css/main.css';
const components = [
    {
        class: Modal,
        selector: '#modal-root',
        options: {
            'DOM_ID':   'settingsModal'
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
})
