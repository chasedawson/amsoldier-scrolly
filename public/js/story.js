// define global variables
var container, graphic, chart, text, step; // html elements
var scroller; // scrollama
var simulation;
var data;
var width, height;

// generic window resize listener event
function handleResize() {
    scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
    // repsonse = { element, direction, index }
    
    // add color to current step only
    step.classed("is-active", function(d, i) {
        return i === response.index;
    });
    
    console.log(response.index);
    switch (response.index) {
        case 0:
            if (simulation) {
                simulation
                    .force('x', d3.forceX(width / 2))
                    .force('y', d3.forceY(height / 2))
                    .alpha(1).restart();
            } else {
                drawChart();
            }
            break;
        case 1:
            var surveyLevels = reduceLevels(countLevels(data, "survey"), 10);
            var selection = d3.selectAll('circle');
            var marks = mark(selection, surveyLevels);
            var xs = {'s32': Math.round(width * 0.25), 's144': Math.round(width * 0.75)};
            simulation
                .force('x', d3.forceX().x(d => {
                    return xs[marks.get(d.index)];
                }))
                .force('y', d3.forceY(height / 2))
                .force('center', null)
                .alpha(1).restart();
            break;

        case 2:
            // color bundles based on racial 
            var s32_racialGroup_levels = reduceLevels(countLevels(data.filter(d => d.survey == "s32"), "racial_group"), 10);
            var s32 = d3.selectAll('.s32');
            var marks = mark(s32, s32_racialGroup_levels);
            var s32_colors = {'black': 'orange', 'white': 'blue'};
            s32.attr('fill', d => s32_colors[marks.get(d.index)]);

            var s144 = d3.selectAll('.s144');
            s144.attr('fill', 'orange');
            break;
    }
}

// kick-off code to run once on load
function init() {
    // select html elements
    container = d3.select('#scrolly-side');
    graphic = container.select('figure');
    chart = graphic.select('.chart');
    text = container.select('article');
    step = text.selectAll('.step');

    // instantiate the scrollama
    scroller = scrollama();

    // force resize on load to ensure proper dimensions are sent to scrollama
    handleResize();

    // setup scroller passing options
    // bind scrollama event handlers
    scroller
      .setup({
          container: '#scrolly-side',
          graphic: 'figure',
          text: 'article',
          step: '.step',
          offset: 0.5,
          debug: true
      })
      .onStepEnter(handleStepEnter);

    window.addEventListener("resize", handleResize);

    // set up chart 
    loadData().then(files => {
        data = files[0];
        // drawChart();
    })

}

// returns a Promise that upon a successful completion responds with an 
// array of objects containing loaded data
function loadData() {
    return Promise.all([
        d3.csv('csv/s32_s144_comb_with_classifications.csv'),
    ]);
}

function drawChart() {
    var nodes = reduceNodes(data);
    width = graphic.node().getBoundingClientRect().width;
    height = graphic.node().getBoundingClientRect().height;

    var svg = chart.append('svg')
        .attr('width', width)
        .attr('height', height);

    simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(0.05))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 2))
        .on('tick', ticked);

    function ticked() {
        svg.selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', d => d.radius)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }

}

function reduceNodes(nodes) {
    var bundleSize = 10; 
    var numBundles = Math.round(nodes.length / bundleSize);
    var bundledNodes = [];
    for (var i = 0; i < numBundles; i += 1) {
        var newNode = {radius: 5};
        bundledNodes.push(newNode);
    }
    return bundledNodes;
}

// counts levels of column in data. returns a Map where each key is a column value and the key's value
// corresponds to the number of occurences of that value in the column
function countLevels(data, col) {
    var levels = new Map();
    for (var i = 0; i < data.length; i += 1) {
        var response = data[i];
        var val = response[col];
        if (levels.has(val)) {
            // level has been seen before, add one to count
            levels.set(val, levels.get(val) + 1);
        } else {
            // level has not been seen before, init to one
            levels.set(val, 1);
        }
    }
    return levels;
}

function reduceLevels(levels, bundleSize) {
    for (var key of levels.keys()) {
        levels.set(key, Math.round(levels.get(key) / bundleSize));
    }
    return levels;
}

function mark(selection, levels) {
    var marks = new Map();
    var nodes = selection.nodes();
    var offset = 0;
    for (var key of levels.keys()) {
        for (var i = 0; i < levels.get(key); i += 1) {
            // modify class of node for d3 selections later
            var node = nodes[i + offset];
            d3.select(node).attr('class', key);

            // modify mark in map for later operations
            marks.set(i + offset, key);
        }
        offset += levels.get(key);
    }
    return marks;
}

// References
// [Easier scrollytelling with position sticky](https://pudding.cool/process/scrollytelling-sticky/)
// [How to implement scrollytelling with six different libraries](https://pudding.cool/process/how-to-implement-scrollytelling/)
// [D3 in Depth: Force Layout](https://www.d3indepth.com/force-layout/)
// [Fascism and Analogies -- British and American, Past and Present](https://lareviewofbooks.org/article/fascism-analogies-british-american-past-present/#disqus_thread)
