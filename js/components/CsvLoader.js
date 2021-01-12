import * as d3 from "d3"
export default class CsvLoader {

    readFileFromPath(pathToCsv) {
        return new Promise((resolve, reject) => {
            this.data = [];
            d3.csv(pathToCsv).then((data) => {
                this.data = data;
                resolve(data);
            });
        });
    }

    readFile(file){
        return new Promise(((resolve, reject) => {
            this.data = [];
            const fr = new FileReader();
            fr.readAsText(file);
            fr.onloadend = () => {
                let parser = d3.dsvFormat(',');
                let parsed = parser.parse(fr.result);
                if(Object.keys(parsed[0]).length === 1){
                    parser = d3.dsvFormat(';');
                    parsed = parser.parse(fr.result);
                }
                this.data = parsed;
                resolve(this.data);
            }
        }));
    }

    getPointsArray(xColumn, yColumn) {
        this.points = [];
        let i = 0
        this.data.forEach( (row) => {
            if(typeof(row[xColumn]) !== 'undefined' && typeof(row[yColumn]) !== 'undefined'){

                this.points.push({
                    x: i,
                    y: parseFloat(row[yColumn])
                });
                i++;
            }
        });
        return this.points;
    }

    getHeaders(){
        return Object.keys(this.data[0]);
    }
}