var api = require('./neo4jApi');

$(function () {
    let start_name = 'Quentin Tarantino';
    fillPersonInfo(start_name);
    fillActor(start_name);
    fillDirector(start_name);
    fillGenre(start_name);
    fillLanguages(start_name);
    fillCoworkers(start_name);
    renderGraph(api.getPerson(start_name));

    $("#search_person_button").click(e => {
        // e.preventDefault();
        let name = $("#search_person").find("input[name=search]").val();
        fillPersonInfo(name);
        fillActor(name);
        fillDirector(name);
        fillGenre(name);
        fillLanguages(name);
        fillCoworkers(name);
        renderGraph(api.getPerson(name));
    });

    $("#search_movie").submit(e => {
        e.preventDefault();
        let name = $("#search_movie").find("input[name=search]").val();
        fillMovieInfo(name);
        fillMovieDirectors(name);
        fillMovieCast(name);
        renderGraph(api.getMovie(name))
        // fillActor(name);
        // fillDirector(name);
        // fillGenre(name);
        // fillLanguages(name);
        // fillCoworkers(name);
        // renderGraph(api.getPerson(name));
    });

    // renderGraph(api.getLink("Kevin Bacon","Meg Ryan"))
});

function fillMovieCast(name) {
    $('#actor_cast_table').find('tbody:first').find('tr').remove();
    api.getMovieCast(name).then(resuts => {
        resuts.forEach(res => {
            $('#actor_cast_table').find('tbody:first').append('<tr><td scope="row">' + res.name + '</td><td>' + res.role + '</td></tr>');
        });
    })
}

function fillMovieDirectors(name) {
    $('#director-table').find('tbody:first').find('tr').remove();
    api.getMovieDirectors(name).then(resuts => {
        resuts.forEach(res => {
            $('#director-table').find('tbody:first').append('<tr><td scope="row">' + res.name + '</td></tr>');
        });
    })
}

function fillMovieInfo(name) {
    let personInfo = $('#movie_info');
    personInfo.find('*').remove();

    //TODO Rename variables
    api.getMovieInfo(name).then(res => {
        let date = new Date(parseInt(res.birthday, 10)).getFullYear();
        personInfo.append('<h2 id="movie_name">' + res.name + '</h2>');
        personInfo.append('<p id="movie_release">' + date + '</p>');
        personInfo.append('<p id="movie_summary">' + res.biography + '</p>');
    })
}


function fillPersonInfo(name) {
    let personInfo = $('#person_info');
    personInfo.find('*').remove();

    api.getPersonInfo(name).then(res => {
        let date = new Date(parseInt(res.birthday, 10)).getFullYear();
        personInfo.append('<h2 id="person_name">' + res.name + '</h2>');
        personInfo.append('<p id="person_birthday">' + date + '</p>');
        personInfo.append('<p id="person_biography">' + res.biography + '</p>');
    })
}

function fillActor(name) {
    $('#actor_table').find('tbody:first').find('tr').remove();
    api.getPersonRoles(name).then(resuts => {
        resuts.forEach(res => {
            let date = new Date(parseInt(res.year, 10)).getFullYear();
            $('#actor_table').find('tbody:first').append('<tr><td scope="row">' + res.title +
                '</td><td>' + date +
                '</td><td>' + res.role + '</td></tr>');
        });
    })
}

function fillDirector(name) {
    $('#director_table').find('tbody:first').find('tr').remove();
    api.getPersonDirectedMovies(name).then(resuts => {
        resuts.forEach(res => {
            let date = new Date(parseInt(res.year, 10)).getFullYear();
            $('#director_table').find('tbody:first').append('<tr><td scope="row">' + res.title +
                '</td><td>' + date + '</td></tr>');
        });
    })
}

function fillGenre(name) {
    $('#genre_table').find('tbody:first').find('tr').remove();
    api.getGenres(name).then(resuts => {
        resuts.forEach(res => {
            $('#genre_table').find('tbody:first').append('<tr><td scope="row">' + res.genre +
                '</td><td>' + res.count + '</td></tr>');
        });
    })
}

function fillLanguages(name) {
    $('#language_table').find('tbody:first').find('tr').remove();
    api.getLanguages(name).then(resuts => {
        resuts.forEach(res => {
            $('#language_table').find('tbody:first').append('<tr><td scope="row">' + res.language +
                '</td><td>' + res.count + '</td></tr>');
        });
    })
}

function fillCoworkers(name) {
    $('#coworkers_table').find('tbody:first').find('tr').remove();
    api.getCoworkers(name).then(resuts => {
        resuts.forEach(res => {
            $('#coworkers_table').find('tbody:first').append('<tr><td scope="row">' + res.name +
                '</td><td>' + res.count + '</td></tr>');
        });
    })
}

function renderGraph(fun) {
    var width = 800, height = 800;
    var force = d3
        .layout
        .force()
        .charge(-200)
        .linkDistance(30)
        .size([width, height]);

    d3.select("#graph").selectAll("*").remove();

    var svg = d3
        .select("#graph")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("pointer-events", "all");
    fun.then(graph => {
        // console.log(graph.nodes);
        // console.log(graph.links);
        force.nodes(graph.nodes).links(graph.links).start();

        // svg.selectAll(".link").remove();//add this to remove the links
        // svg.selectAll(".node").remove();//add this to remove the nodes

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
