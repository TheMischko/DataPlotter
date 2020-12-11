
import MainPlot from "./components/main-plot";
import CsvLoader from "./components/CsvLoader";

const components = [
    {
        class: MainPlot,
        selector: '.main-plot',
        options: {}
    }
];

components.forEach(component => {
    if(document.querySelector(component.selector) !== null){
        document.querySelectorAll(component.selector).forEach(
            element => new component.class(element, component.options)
        )
    }
});

let csv = new CsvLoader('src/csv_test.csv');
setTimeout(() => {
    console.log(csv.getPointsArray('speed_tacho', 'speed_esp'));
}, 1000);
