import * as d3 from "d3";
import CsvLoader from "./CsvLoader";
import css from "../../css/plot.css"

export default class Plot{

    constructor(element, selector, options) {
        this.element = element;

        //console.log("Margin left: "+ this.element.offsetLeft);
        this.selector = selector;
        this.options = options;
        this.zoomManager = options.zoomManager;

        this.parseData(options.data).then();

        this.lineFunctions = {};
        this.lineGraphs = {};
        this.points = {};
        this.tooltips = {};

        this.group = options.group;
        this.parent = d3.select(this.element.parentNode);

        d3.select(element).attr('group', this.group);
        window.addEventListener('resize', (e) => {
            this.resize(e);
        })

        this.init(element);

        //console.log('Selector: ' + selector);
        //console.log('Element: ' + this.element);
        //console.log(this.element.getBoundingClientRect());

        this.setAxis();

        this.drawPlot();
    }


    parseData(data){
        this.data = [];
        return new Promise((resolve => {
            data.forEach((course, i) => {
                this.data.push({
                    points: course.values,
                    color: course.color,
                    courseID: i,
                    xColumn: course.xColumn,
                    yColumn: course.yColumn,
                    func: course.func
                })
            });
        }));
    }


    /**
     * Initiate basic properties of plot like element at DOM, margins and sizes.
     * @param element Corresponding DOM element for plot.
     */
    init(element){
        this.margin = {
            top: 10,
            right: 30,
            bottom: 30,
            left: window.innerWidth < 900 ? 40 : 60
        }
        // Setting dimensions of the plot
        this.width = this.parent.node().offsetWidth - this.margin.left - this.margin.right;
        this.height = window.innerHeight/2.2 - this.margin.top - this.margin. bottom;
        this.ticksCount = 10;

        this.DOM_id = this.options.DOM_ID;
        // Main element
        this.svg = d3
            .select(element)
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin. bottom)
            .append("g")
            .attr('id', this.DOM_id)
            .attr("transform",
                "translate("+this.margin.left+","+this.margin.top+")")
            .on("mousemove", (e) => {
                if(e.target.tagName === "circle"){
                    console.log(e.target.getAttribute("courseID"))
                }
                const event = new MouseEvent('plotMouseOver', e)
                event.group = this.group;
                event.sourcePlot = this.element;
                document.dispatchEvent(event);
            })
            .on("mouseleave", (e) => {
                const event = new MouseEvent('plotMouseLeave', e)
                event.group = this.group;
                event.sourcePlot = this.element;
                document.dispatchEvent(event);
            });

        document.addEventListener('plotMouseOver', e => {
            this.showMouseTooltip(e);
        })

        // Tooltip divs
        this.data.forEach((course) => {
            this.tooltips[course.courseID] = d3.select(document.body)
              .append('div')
              .attr('class', 'tooltip')
              .attr('plotID', this.DOM_id.split("wrapper-plot-")[0])
              .attr('courseID', course.courseID)
              .style('opacity', 0)
        })



        // Add clipPath - everything out of this area won't be drawn.
        this.clipId = "clip-"+Date.now();
        this.clip = this.svg.append("defs")
            .append("svg:clipPath")
            .attr("id",this.clipId)
            .append("svg:rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("x", 0)
            .attr("y", 0);

        // A function that set idleTimeOut to null
        localStorage.setItem('idleTimeout', null)

        // A function that set idleTimeOut to null
        localStorage.setItem('selection', JSON.stringify([0, 1]));

        localStorage.setItem('default-selection', JSON.stringify([0, 1]));

        localStorage.setItem('activeZoom', null);

        // Add brushing
        this.brush = d3.brushX()
            // initialise the brush area: start at 0,0 and finishes at width,height:
            // it means I select the whole graph area
            .extent([ [0,0], [this.width, this.height] ])
            // Each time the brush selection changes, trigger the 'updateChart' function
            .on("end", (e) => {
                if(typeof(e.sourceEvent) !== 'undefined') {
                    const event = new Event('plotSelectionChanged')
                    event.from = 'mouse';
                    const selection = e.selection !== null
                      ? [e.selection[0]/(this.width-this.margin.left), e.selection[1]/(this.width-this.margin.left)]
                      : null;
                    localStorage.setItem('selection', JSON.stringify(selection));
                    document.dispatchEvent(event);
                }
            });

        document.addEventListener('plotSelectionChanged', (data) => {
            let selection = JSON.parse(localStorage.getItem('selection'));
            const sel = selection !== null
                ? [selection[0]*(this.width-this.margin.left), selection[1]*(this.width-this.margin.left)]
                : null;
            this.updateChart(this, {selection: sel}, true)
        });

    }


    /**
     * Set both axis for corresponding to the data in this.data property.
     */
    setAxis(){
        /***********************************
                    X axis
         ***********************************/

        const boundaries = this.findBoundaries();

        this.xScale = d3.scaleLinear()
            .domain([boundaries.minX, boundaries.maxX])
            .range([0, this.width])
            .nice(50);

        this.xAxis = this.svg
            .append("g")
            .attr('id', 'xAxis')
            .attr("transform", "translate(0," + this.height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(this.xScale));

        this.xGrid = this.svg.append('g')
            .attr('id', 'xGrid')
            .attr('class', 'grid')
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.makeGridLinesX()
                .tickSize(-this.height)
                .tickFormat(""));

        /***********************************
                    Y axis
         ***********************************/
        this.yScale = d3.scaleLinear()
            .domain([boundaries.minY, boundaries.maxY])
            .range([this.height, 0]);

        this.svg.append("g")
            .attr('id', 'yAxis')
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale))

        this.svg.append('g')
            .attr('class', 'grid')
            .attr('id', 'yGrid')
            .call(this.makeGridlinesY()
                .tickSize(-this.width)
                .tickFormat(''));
    }


    drawPlot(){
        // Tooltip line
        this.svg
            .append('g')
            .append('line')
            .classed('tooltip-line', true)
            .attr('target-id', this.DOM_id)
            .attr('x1', 100)
            .attr('x2', 100)
            .attr('y1', 0)
            .attr('y2', this.height)
            .attr('style', "stroke:rgb(255,0,0);stroke-width:2")
        // Line
        this.lineFunction = d3.line()
          .x((data) => {
              return this.xScale(data.x);
          })
          .y((data) => {
              return this.yScale(data.y);
          })
          .curve(d3.curveNatural);

        this.data.forEach((course) => {

            this.lineGraphs[course.courseID] = this.svg.append("g")
              .attr("clip-path", "url(#"+this.clipId+")");

            this.lineGraphs[course.courseID]
              .append('path')
              .attr('id', 'lineGraph-path')
              .attr('class', 'curve')
              .attr('d', this.lineFunction(course.points))
              .attr('style', `stroke:${course.color};`);

            // Points
            this.points[course.courseID] = this.svg.append("g")
              .attr("clip-path", "url(#"+this.clipId+")");

            // Add the brushing
            this.points[course.courseID]
              .append('g')
              .attr('class', 'brush')
              .call(this.brush)
            /*
            this.points[course.courseID]
              .selectAll('.dot')
              .data(course.points)
              .enter()
              .append('circle')
              .classed('dot', true)
              .attr('courseID', course.courseID)
              .attr('r', 3)
              .attr('cx', (data) => this.xScale(data.x))
              .attr('cy', (data) => this.yScale(data.y))
              .on("mouseover", (e, data) => {
                  this.pointsMouseOver(e, data);
              })
              .on("mouseout", (e, i) => {
                  this.pointsMouseOut(e, i);
              });*/
        })
    }


    /**
     * Used to find max and min values for data in this.data property.
     * @returns {{minY: number, minX: number, maxY: number, maxX: number}}
     */
    findBoundaries(){
        const boundaries = {
            'minX': Number.MAX_SAFE_INTEGER,
            'maxX': Number.MIN_SAFE_INTEGER,
            'minY': Number.MAX_SAFE_INTEGER,
            'maxY': Number.MIN_SAFE_INTEGER
        }

        this.data.forEach( (course) => {
            course.points.forEach(point => {
                boundaries.maxX = point.x > boundaries.maxX ? point.x : boundaries.maxX;
                boundaries.minX = point.x < boundaries.minX ? point.x : boundaries.minX;
                boundaries.maxY = point.y > Number(boundaries.maxY) ? point.y : Number(boundaries.maxY);
                boundaries.minY = point.y < Number(boundaries.minY) ? point.y : Number(boundaries.minY);
            });
        });
        return boundaries;
    }


    /**
     * Creates X-axis gridlines in graph.
     * @returns {*|[*]|[]|*[]}
     */
    makeGridLinesX() {
        return d3.axisBottom(this.xScale).ticks(this.ticksCount);
    }


    /**
     * Creates Y-axis gridlines in graph.
     * @returns {*|[*]|[]|*[]}
     */
    makeGridlinesY() {
        return d3.axisLeft(this.yScale)
            .ticks(this.ticksCount)
    }


    /**
     * A function that set idleTimeOut to null
     */
    idled() {
        localStorage.setItem('idleTimeout', 'false');
    }

    /**
     * Function that redraw graph in chosen region for zoom.
     * @param ref This object
     * @param selection Tuple of starting point and ending point for zoom.
     * @param resetSelectionAfter Boolean if method should save default selection value into selection.
     * @returns {number}
     */
    updateChart(ref, {selection}, resetSelectionAfter = false ) {
        let extent = selection;
        let idleTimeout = JSON.parse(localStorage.getItem('idleTimeout'));

        // If no selection, back to initial coordinate.
        // Otherwise update X axis domain
        if(extent === null){
            if(idleTimeout === null)
                // This allows to wait a little bit
                return idleTimeout = setTimeout(() => {ref.idled();}, 350);
            const boundaries = this.findBoundaries();
            ref.xScale.domain([boundaries.minX, boundaries.maxX]);
        } else {
            ref.xScale.domain([ ref.xScale.invert(extent[0]), ref.xScale.invert(extent[1]) ]);
            // This removes the grey brush area as soon as the selection has been done
            ref.data.forEach((course) => {
                ref.points[course.courseID].select('.brush').call(ref.brush.move, null);
            })
        }


        //Update axis and circle position
        ref.xAxis
            .transition()
            .duration(200)
            .call(d3.axisBottom(ref.xScale))
        ref.xGrid
            .transition()
            .duration(200)
            .call(this.makeGridLinesX()
                .tickSize(-ref.height)
                .tickFormat(""));

        this.lineFunction = d3.line()
              .x((data) => {
                  return ref.xScale(data.x);
              })
              .y((data) => {
                  return ref.yScale(data.y);
              })
              .curve(d3.curveNatural);

        this.data.forEach((course) => {
            const lineGraph = ref.lineGraphs[course.courseID];
            lineGraph
              .selectAll('path')
              .transition()
              .duration(200)
              .attr('d', this.lineFunction(course.points));

            const points = ref.points[course.courseID];
            points
              .selectAll('.dot')
              .transition()
              .duration(200)
              .attr('cx', (data) => ref.xScale(course.points.x))
              .attr('cy', (data) => ref.yScale(course.points.y))

        });
    }


    pointsMouseOver(e, data) {
        /*
        d3.select(e.target).transition()
            .duration('100')
            .attr("r", 5);*/
        /*
        this.tooltip.transition()
            .duration('100')
            .style('opacity', 1);
        this.tooltip.html('['+data.x+'; '+data.y+']')
            .style('left', (e.pageX + 10) + "px")
            .style('top', (e.pageY - 15) + "px")*/
    }


    pointsMouseOut(e, i) {
        /*
        d3.select(e.target).transition()
            .duration('100')
            .attr("r", 3);

        this.tooltip.transition()
            .duration('100')
            .style('opacity', 0);*/
    }


    showMouseTooltip(e) {
        // This allows to find the closest X index of the mouse:
        const bisect = d3.bisector(function(d) { return d.x; }).left;
        const x0 = this.xScale.invert(e.pageX-this.element.getBoundingClientRect().x-this.margin.left);
        d3.selectAll('.tooltip-line')
            .attr('x1', e.pageX-this.element.getBoundingClientRect().x-this.margin.left)
            .attr('x2', e.pageX-this.element.getBoundingClientRect().x-this.margin.left);

        this.data.forEach((course) => {
            const tooltip = this.tooltips[course.courseID];
            const i = bisect(course.points, x0, 1);
            if(typeof (course.points[i]) === 'undefined'){
                return
            }
            tooltip.style('opacity', 0.9);

            //tooltip.html('['+course.points[i].x+'; '+course.points[i].y+']')
            tooltip.html(`[${parseFloat(course.points[i].x).toFixed(2)};
            ${parseFloat(course.points[i].y).toFixed(2)}]`)
                .style('left', (this.xScale(course.points[i].x) + 10 + this.element.getBoundingClientRect().x) + "px")
                .style('top', (this.yScale(course.points[i].y)+ 10 + this.element.getBoundingClientRect().y) + "px")
                .style('background-color', course.color)
                .style('border-color', course.color);
        });
    }

    resize(e){
        this.margin.left = window.innerWidth < 900 ? 40 : 60;
        this.width = this.parent.node().offsetWidth - this.margin.left - this.margin.right;
        this.height = window.innerHeight/2.5 - this.margin.top - this.margin. bottom;

        this.svg = d3
          .select(this.element)
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin. bottom)
          .select("g")
          .attr("transform",
            "translate("+this.margin.left+","+this.margin.top+")");

        const clip_test = this.svg.select("defs")
          .select("clipPath")
          .select("rect")
          .attr("width", this.width)
          .attr("height", this.height)
          .attr("x", 0)
          .attr("y", 0);

        this.brush.extent([ [0,0], [this.width, this.height] ]);

        const boundaries = this.findBoundaries();

        this.xScale = d3.scaleLinear()
          .domain([boundaries.minX, boundaries.maxX])
          .range([0, this.width])
          .nice(50);

        this.xAxis = this.svg
          .select('#xAxis')
          .attr("transform", "translate(0," + this.height + ")")
          .call(d3.axisBottom(this.xScale));

        this.xGrid = this.svg
          .select('#xGrid')
          .attr("transform", "translate(0," + this.height + ")")
          .call(this.makeGridLinesX()
            .tickSize(-this.height)
            .tickFormat(""));

        /***********************************
         Y axis
         ***********************************/
        this.yScale = d3.scaleLinear()
          .domain([boundaries.minY, boundaries.maxY])
          .range([this.height, 0]);

        this.svg.select("#yAxis")
          .call(d3.axisLeft(this.yScale))

        this.svg.select('#yGrid')
          .call(this.makeGridlinesY()
            .tickSize(-this.width)
            .tickFormat(''));

        this.svg
          .select(`[target-id=${this.DOM_id}]`)
          .attr('target-id', this.DOM_id)
          .attr('x1', 100)
          .attr('x2', 100)
          .attr('y1', 0)
          .attr('y2', this.height)

        this.lineGraph
          .select('#lineGraph-path')
          .attr('d', this.lineFunction(this.data));

        this.points
          .select('.brush')
          .call(this.brush)

        this.points
          .selectAll('.dot')
          .data(this.data)
          .enter()
          .select('circle')
          .attr('r', 3)
          .attr('cx', (data) => this.xScale(data.x))
          .attr('cy', (data) => this.yScale(data.y))
    }
}