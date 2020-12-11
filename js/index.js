
import MainPlot from "./components/main-plot";

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
})