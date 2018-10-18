var api = require('./neo4jApi');

$(function () {
    renderGraph();
    search();

    $("#search").submit(e => {
        e.preventDefault();
        search();
    });
});

function showMovie(title) {
    api
        .getMovie(title)
        .then(movie => {
            if (!movie) return;

            $("#title").text(movie.title);
            $("#poster").attr("src", "http://neo4j-contrib.github.io/developer-resources/language-guides/assets/posters/" + movie.title + ".jpg");
            var $list = $("#crew").empty();
            movie.cast.forEach(cast => {
                $list.append($("<li>" + cast.name + " " + cast.job + (cast.job == "acted" ? " as " + cast.role : "") + "</li>"));
            });
        }, "json");
}

function search() {
    var query = $("#search").find("input[name=search]").val();
    api
        .searchMovies(query)
        .then(movies => {
            var t = $("table#results tbody").empty();

            if (movies) {
                movies.forEach(movie => {
                    $("<tr><td class='movie'>" + movie.title + "</td><td>" + movie.released + "</td><td>" + movie.tagline + "</td></tr>").appendTo(t)
                        .click(function () {
                            showMovie($(this).find("td.movie").text());
                        })
                });

                var first = movies[0];
                if (first) {
                    showMovie(first.title);
                }
            }
        });
}

function renderGraph() {
    var width = 800, height = 800;
    var force = d3
        .layout
        .force()
        .charge(-200)
        .linkDistance(30)
        .size([width, height]);

    var svg = d3
        .select("#graph")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("pointer-events", "all");

    api
        .getGraph(10)
        .then(graph => {
            force.nodes(graph.nodes).links(graph.links).start();

            var link = svg.selectAll(".link")
                .data(force.links())
                .enter().append("line")
                .attr("class", "link");

            var node = svg.selectAll(".node")
                .data(force.nodes())
                .enter().append("g")
                .attr("class", "node")
                .call(force.drag);

            node.append("circle")
                .attr("class", d => {
                    return "node " + d.label
                })
                .attr("r", 8);

            node.append("text")
                .attr("x", 12)
                .attr("dy", ".35em")
                .text(function (d) {
                    return d.title;
                });

            force.on("tick", () => {
                link
                    .attr("x1", function (d) {
                        return d.source.x;
                    })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });

                node
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
            })
        });
}
