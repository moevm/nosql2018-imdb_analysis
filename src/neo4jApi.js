require('file?name=[name].[ext]!../node_modules/neo4j-driver/lib/browser/neo4j-web.min.js');
var Movie = require('./models/Movie');
var MovieCast = require('./models/MovieCast');
var _ = require('lodash');

var neo4j = window.neo4j.v1;
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "qwerty"));


//TODO Rename variables
function getMovieInfo(name) {
    let session = driver.session();
    return session.run('MATCH (m:Movie) WHERE m.title =~ {title} RETURN m.title as name, m.releaseDate as birthday, m.description as biography LIMIT 1', {title: '.*' + name + '.*'})
        .then(results => {
            session.close();
            let person_info;
            results.records.forEach(res => {
                person_info = {
                    birthday: res.get('birthday'),
                    name: res.get('name'),
                    biography: res.get('biography')
                };
            });
            return person_info;
        })
}

function getLink(name1, name2) {
    let session = driver.session();
    return session.run('MATCH p=shortestPath((bacon:Person {name:{title1}})-[*]-(meg:Person {name:{title2}})) ' +
        'UNWIND relationships(p) as r ' +
        'RETURN r.name as role,startNode(r).name as source,endNode(r).title as target LIMIT 50', {
        title1: name1,
        title2: name2
    })
        .then(results => {
            session.close();
            var nodes = [], rels = [], i = 0;
            results.records.forEach(res => {
                var source_node = {title: res.get('source'), label: 'actor'};
                var target_node = {title: res.get('target'), label: 'movie'};

                var source = _.findIndex(nodes, source_node);
                var target = _.findIndex(nodes, target_node);

                if (source == -1) {
                    nodes.push(source_node);
                    source = i;
                    i++;
                }
                if (target == -1) {
                    nodes.push(target_node);
                    target = i;
                    i++;
                }
                rels.push({source, target})
            });
            return {nodes, links: rels};
        })
}

//TODO Rename variables
function getMovie(name) {
    let session = driver.session();
    return session.run('MATCH (p:Movie)-[]-(a:Person) WHERE p.title =~ {title} RETURN p.title as title,collect(a.name) as actors ORDER BY title LIMIT 1', {title: '.*' + name + '.*'})
        .then(results => {
            session.close();
            var nodes = [], rels = [], i = 0;
            results.records.forEach(res => {
                console.log(res);
                nodes.push({title: res.get('title'), label: 'movie'});
                var target = i;
                i++;

                res.get('actors').forEach(name => {
                    var movie = {title: name, label: 'actor'};
                    var source = _.findIndex(nodes, movie);
                    if (source == -1) {
                        nodes.push(movie);
                        source = i;
                        i++;
                    }
                    rels.push({source, target})
                })
            });

            return {nodes, links: rels};
        })
}

function getMovieDirectors(name) {
    let session = driver.session();
    return session
        .run('MATCH (p:Movie)-[:DIRECTED]-(a:Person) WHERE p.title =~ {title} RETURN p.title as title,collect(a.name) as actors ORDER BY title LIMIT 1', {title: '.*' + name + '.*'})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                res.get('actors').forEach(name => {
                    tuples.push({name: name});
                })
            });

            return tuples;
        })
}

function getMovieCast(name) {
    let session = driver.session();
    return session
        .run('MATCH (p:Movie)-[r:ACTS_IN]-(a:Person) WHERE p.title =~ {title} RETURN p.title as title,collect(a.name) as actors,collect(r.name) as role ORDER BY title LIMIT 1', {title: '.*' + name + '.*'})
        .then(results => {
            session.close();
            let tuples = [];
            results.records.forEach(res => {
                // console.log(res.get('actors')[0],"<------- HERE");
                var i = 0;
                res.get('actors').forEach(name => {
                    tuples.push({name: name, role: res.get('role')[i]});
                    i++;
                })
            });

            return tuples;
        })
}

function getPerson(name) {
    let session = driver.session();
    return session.run('MATCH (p:Person{name:{title}})-[:ACTS_IN]-(a:Movie) RETURN p.name as person,collect(a.title) as movies LIMIT 50', {title: name})
        .then(results => {
            session.close();
            var nodes = [], rels = [], i = 0;
            results.records.forEach(res => {
                nodes.push({title: res.get('person'), label: 'actor'});
                var target = i;
                i++;

                res.get('movies').forEach(name => {
                    var movie = {title: name, label: 'movie'};
                    var source = _.findIndex(nodes, movie);
                    if (source == -1) {
                        nodes.push(movie);
                        source = i;
                        i++;
                    }
                    rels.push({source, target})
                })
            });
            return {nodes, links: rels};
        })
}

//TODO Name LIKE search - now it's strict search by name
function getPersonInfo(name) {
    let session = driver.session();
    return session.run('MATCH (p:Person{name:{title}}) RETURN p.birthday as birthday, p.name as name, p.biography as biography', {title: name})
        .then(results => {
            session.close();
            let person_info;
            results.records.forEach(res => {
                person_info = {
                    birthday: res.get('birthday'),
                    name: res.get('name'),
                    biography: res.get('biography')
                };
            });
            return person_info;
        })
}

//TODO Name LIKE search - now it's strict search by name
function getPersonRoles(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:ACTS_IN]-(a:Movie) RETURN a.title as movie,a.releaseDate as year,r.name as role LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({title: res.get('movie'), year: res.get('year'), role: res.get('role')});
            });

            return tuples;
        })
}

//TODO Name LIKE search - now it's strict search by name
function getPersonDirectedMovies(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(a:Movie) RETURN a.title as movies,a.releaseDate as year LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({title: res.get('movies'), year: res.get('year')});
            });

            return tuples;
        })
}

//TODO Name LIKE search - now it's strict search by name
function getGenres(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(a:Movie) RETURN a.genre as genre, count(*) as count LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({genre: res.get('genre'), count: res.get('count')});
            });

            return tuples;
        })
}

//TODO Name LIKE search - now it's strict search by name
function getLanguages(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(a:Movie) RETURN a.language as language, count(*) as count LIMIT 50", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({language: res.get('language'), count: res.get('count')});
            });

            return tuples;
        })
}

//TODO Name LIKE search - now it's strict search by name
function getCoworkers(name) {
    let session = driver.session();
    return session
        .run("MATCH (p:Person{name:{title}})-[r:DIRECTED]-(m:Movie)-[]-(a:Actor) RETURN a.name as name, count(*) as count ORDER BY count DESC", {title: name})
        .then(results => {
            session.close();
            let tuples = [];

            results.records.forEach(res => {
                tuples.push({name: res.get('name'), count: res.get('count')});
            });

            return tuples;
        })
}


//TODO Name LIKE search - now it's strict search by name
function getGraph(limit) {
    var session = driver.session();
    return session.run(
        'MATCH (m:Movie)<-[:ACTS_IN]-(a:Person) RETURN m.title AS movie, collect(a.name) AS cast LIMIT {limit}', {limit})
        .then(results => {
            session.close();
            var nodes = [], rels = [], i = 0;
            results.records.forEach(res => {
                nodes.push({title: res.get('movie'), label: 'movie'});
                var target = i;
                i++;

                res.get('cast').forEach(name => {
                    var actor = {title: name, label: 'actor'};
                    var source = _.findIndex(nodes, actor);
                    if (source == -1) {
                        nodes.push(actor);
                        source = i;
                        i++;
                    }
                    rels.push({source, target})
                })
            });

            return {nodes, links: rels};
        });
}

exports.getMovieCast = getMovieCast;
exports.getMovieDirectors = getMovieDirectors;
exports.getLink = getLink;
exports.getMovie = getMovie;
exports.getMovieInfo = getMovieInfo;
exports.getPerson = getPerson;
exports.getPersonRoles = getPersonRoles;
exports.getPersonDirectedMovies = getPersonDirectedMovies;
exports.getGenres = getGenres;
exports.getLanguages = getLanguages;
exports.getCoworkers = getCoworkers;
exports.getPersonInfo = getPersonInfo;
exports.getGraph = getGraph;

