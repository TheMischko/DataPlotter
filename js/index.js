
import MainPlot from "./components/main-plot";
import CsvLoader from "./components/CsvLoader";
import Modal from "./components/Settings/SettingsModal";
import css from '/css/main.css';
const components = [
    {
        class: MainPlot,
        selector: '.main-plot',
        options: {}
    },
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

const getCsv = async () => {
    let csv = new CsvLoader();
    let data = await csv.readFile('src/csv_test.csv');
    console.log(csv.getPointsArray('speed_tacho', 'speed_esp'));
}

getCsv();
