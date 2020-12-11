import * as d3 from "d3"
export default class CsvLoader {
    constructor(pathToCsv) {
        this.data = [];
        d3.csv(pathToCsv).then((data) => {
            this.data = data;
            console.log(this.data);
        });


    }

    getPointsArray(xColumn, yColumn) {
        this.points = [];
        this.data.forEach( (row) => {
            if(typeof(row[xColumn]) !== 'undefined' && typeof(row[yColumn]) !== 'undefined'){

                this.points.push({
                    x: row[xColumn],
                    y: row[yColumn]
                })
            }
        });
        return this.points;
    }
}